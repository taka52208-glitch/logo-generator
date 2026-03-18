import os
from pathlib import Path

from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(env_path)

CLOUDFLARE_ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
CLOUDFLARE_API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3847")
