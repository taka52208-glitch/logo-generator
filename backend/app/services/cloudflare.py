import asyncio
import base64
import httpx
from app.config import CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, GEMINI_API_KEY

# --- Leonardo Lucid Origin (primary — high quality) ---

LUCID_URL = (
    f"https://api.cloudflare.com/client/v4/accounts/"
    f"{CLOUDFLARE_ACCOUNT_ID}/ai/run/"
    f"@cf/leonardo/lucid-origin"
)

LOGO_PREFIX = (
    "Professional brand identity mark. "
)

LOGO_SUFFIX = (
    " Crisp vector edges, mathematically precise curves. "
    "Centered on #FFFFFF pure white background. "
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


# --- Public API: Lucid Origin → Gemini → error ---

async def _generate_single_logo(prompt: str) -> str:
    try:
        return await _generate_lucid(prompt)
    except Exception:
        return await _generate_gemini(prompt)


async def generate_logos(prompts: list[str]) -> list[str]:
    tasks = [_generate_single_logo(p) for p in prompts]
    return await asyncio.gather(*tasks)
