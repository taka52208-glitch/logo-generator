import asyncio
import base64
import io
import httpx
from PIL import Image, ImageOps
from app.config import CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, GEMINI_API_KEY

# --- Leonardo Lucid Origin (primary — high quality) ---

LUCID_URL = (
    f"https://api.cloudflare.com/client/v4/accounts/"
    f"{CLOUDFLARE_ACCOUNT_ID}/ai/run/"
    f"@cf/leonardo/lucid-origin"
)

LOGO_PREFIX = (
    "Professional brand identity mark, extremely large scale filling the entire frame. "
    "Close-up view, zoomed in, the icon should touch the edges of the image. "
)

LOGO_SUFFIX = (
    " The icon MUST be enormous, taking up at least 85% of the image area with very thin margins. "
    "Extreme close-up composition like a app icon. "
    "Crisp vector edges, mathematically precise curves. "
    "Pure white #FFFFFF background. "
    "No text, no letters, no words, no typography, no watermark. "
    "Behance portfolio quality, award-winning logo design."
)


async def _generate_lucid(prompt: str) -> str:
    enhanced = LOGO_PREFIX + prompt + LOGO_SUFFIX
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            LUCID_URL,
            headers={"Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"},
            json={
                "prompt": enhanced,
                "width": 1024,
                "height": 1024,
                "num_steps": 30,
                "guidance": 8.0,
            },
        )
        resp.raise_for_status()

        content_type = resp.headers.get("content-type", "")
        if "image/" in content_type:
            return base64.b64encode(resp.content).decode("utf-8")

        data = resp.json()
        if "result" in data and "image" in data["result"]:
            return data["result"]["image"]

        raise ValueError(f"Unexpected response: {str(data)[:200]}")


# --- Gemini 2.5 Flash Image (fallback) ---

GEMINI_IMAGE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash-image:generateContent"
)

GEMINI_LOGO_PROMPT = """You are a world-class logo designer. Generate a single, clean, professional logo mark.
RULES: Output ONLY a visual icon/symbol — NO text/letters. Pure white background. Flat vector style, 2-3 colors max, centered."""


async def _generate_gemini(prompt: str) -> str:
    full_prompt = f"{GEMINI_LOGO_PROMPT}\n\nDesign brief:\n{prompt}"
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            GEMINI_IMAGE_URL,
            headers={
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {
                    "responseModalities": ["IMAGE"],
                    "imageConfig": {"aspectRatio": "1:1", "imageSize": "1K"},
                },
            },
        )
        resp.raise_for_status()
        data = resp.json()

        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                inline = part.get("inlineData") or part.get("inline_data")
                if inline and "data" in inline:
                    return inline["data"]

        raise ValueError(f"No image in response: {str(data)[:300]}")


# --- Post-processing: auto-crop and enlarge icon ---

def _autocrop_and_enlarge(b64_image: str, target_fill: float = 0.80) -> str:
    """Detect the icon on white bg, crop it, and re-center at target_fill ratio."""
    img_bytes = base64.b64decode(b64_image)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    w, h = img.size

    # Create mask: non-white pixels (threshold 240)
    pixels = img.load()
    bbox = None
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r < 240 or g < 240 or b < 240:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x <= min_x or max_y <= min_y:
        return b64_image  # No content found

    # Add small padding
    pad = 10
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(w, max_x + pad)
    max_y = min(h, max_y + pad)

    # Crop
    cropped = img.crop((min_x, min_y, max_x, max_y))
    cw, ch = cropped.size

    # Calculate scale to fill target_fill of canvas
    icon_ratio = max(cw, ch) / max(w, h)
    if icon_ratio >= target_fill - 0.05:
        return b64_image  # Already large enough

    target_size = int(max(w, h) * target_fill)
    scale = target_size / max(cw, ch)
    new_w = int(cw * scale)
    new_h = int(ch * scale)
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)

    # Place on white canvas
    canvas = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    offset_x = (w - new_w) // 2
    offset_y = (h - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y), resized)

    # Convert back to base64
    out = io.BytesIO()
    canvas.convert("RGB").save(out, format="PNG")
    return base64.b64encode(out.getvalue()).decode("utf-8")


# --- Public API: Lucid Origin → Gemini → error ---

async def _generate_single_logo(prompt: str) -> str:
    try:
        raw = await _generate_lucid(prompt)
    except Exception:
        raw = await _generate_gemini(prompt)
    return _autocrop_and_enlarge(raw)


async def generate_logos(prompts: list[str]) -> list[str]:
    tasks = [_generate_single_logo(p) for p in prompts]
    return await asyncio.gather(*tasks)
