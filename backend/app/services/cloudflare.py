import asyncio
import base64
import httpx
from app.config import CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN

FLUX_URL = (
    f"https://api.cloudflare.com/client/v4/accounts/"
    f"{CLOUDFLARE_ACCOUNT_ID}/ai/run/"
    f"@cf/black-forest-labs/flux-1-schnell"
)

LOGO_QUALITY_SUFFIX = (
    ", professional logo design, scalable, high contrast, "
    "clean sharp edges, centered composition, "
    "isolated on pure white background, no text, no letters, "
    "no watermark, vector style, Adobe Illustrator quality"
)


async def _generate_single_logo(prompt: str) -> str:
    enhanced_prompt = prompt + LOGO_QUALITY_SUFFIX
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            FLUX_URL,
            headers={"Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"},
            json={
                "prompt": enhanced_prompt,
                "steps": 8,
                "width": 1024,
                "height": 1024,
            },
        )
        resp.raise_for_status()

        content_type = resp.headers.get("content-type", "")
        if "image/" in content_type:
            return base64.b64encode(resp.content).decode("utf-8")

        data = resp.json()
        if "result" in data and "image" in data["result"]:
            return data["result"]["image"]

        raise ValueError(f"Unexpected response format: {str(data)[:200]}")


async def generate_logos(prompts: list[str]) -> list[str]:
    tasks = [_generate_single_logo(p) for p in prompts]
    return await asyncio.gather(*tasks)
