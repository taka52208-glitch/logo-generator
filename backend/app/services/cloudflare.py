import asyncio
import base64
import httpx
from app.config import CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, GEMINI_API_KEY

# --- Gemini 2.5 Flash Image (primary) ---

GEMINI_IMAGE_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash-image:generateContent"
)

LOGO_SYSTEM_PROMPT = """You are a world-class logo designer. Generate a single, clean, professional logo mark.

CRITICAL RULES:
- Output ONLY a visual icon/symbol mark — absolutely NO text, NO letters, NO words in the image
- Pure white background (#FFFFFF), nothing else in the background
- Flat vector style, clean sharp edges, minimal design
- Maximum 2-3 colors, high contrast
- Perfectly centered composition
- The logo must look like it was designed in Adobe Illustrator — crisp, scalable, geometric precision
- Think of iconic logos: Apple, Nike swoosh, Airbnb, Spotify — that level of simplicity and recognizability"""


async def _generate_gemini(prompt: str) -> str:
    full_prompt = f"{LOGO_SYSTEM_PROMPT}\n\nDesign brief:\n{prompt}"

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
                    "imageConfig": {
                        "aspectRatio": "1:1",
                        "imageSize": "1K",
                    },
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


# --- Cloudflare FLUX.1 Schnell (fallback) ---

FLUX_URL = (
    f"https://api.cloudflare.com/client/v4/accounts/"
    f"{CLOUDFLARE_ACCOUNT_ID}/ai/run/"
    f"@cf/black-forest-labs/flux-1-schnell"
)

FLUX_QUALITY = (
    "single icon mark, minimal flat vector logo, on pure white background, "
    "professional logo design, clean sharp edges, high contrast, centered, "
    "no text, no letters, no words, no typography, no watermark, "
    "simple geometric, scalable, 2 colors maximum"
)


async def _generate_flux(prompt: str) -> str:
    enhanced = f"{prompt}, {FLUX_QUALITY}"
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            FLUX_URL,
            headers={"Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"},
            json={"prompt": enhanced, "steps": 8, "width": 1024, "height": 1024},
        )
        resp.raise_for_status()

        content_type = resp.headers.get("content-type", "")
        if "image/" in content_type:
            return base64.b64encode(resp.content).decode("utf-8")

        data = resp.json()
        if "result" in data and "image" in data["result"]:
            return data["result"]["image"]

        raise ValueError(f"Unexpected response: {str(data)[:200]}")


# --- Public API: try Gemini first, fallback to FLUX ---

async def _generate_single_logo(prompt: str) -> str:
    try:
        return await _generate_gemini(prompt)
    except Exception:
        return await _generate_flux(prompt)


async def generate_logos(prompts: list[str]) -> list[str]:
    tasks = [_generate_single_logo(p) for p in prompts]
    return await asyncio.gather(*tasks)
