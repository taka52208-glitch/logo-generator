import signal
import sys

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGIN
from app.schemas import (
    AnalyzeRequest,
    FetchUrlRequest,
    FetchUrlResponse,
    GenerateLogosRequest,
    GenerateLogosResponse,
    GeneratePromptsRequest,
    GeneratePromptsResponse,
    GenerateProposalRequest,
    GenerateProposalResponse,
)
from app.services.cloudflare import generate_logos
from app.services.gemini import analyze_brief, generate_prompts, generate_proposal
from app.services.scraper import fetch_page_text

app = FastAPI(title="ロゴ作成ジェネレーター API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
        "http://localhost:3847",
        "http://localhost:3848",
        "http://127.0.0.1:3847",
        "http://127.0.0.1:3848",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _graceful_shutdown(signum, frame):
    sys.exit(0)


signal.signal(signal.SIGTERM, _graceful_shutdown)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/fetch-url", response_model=FetchUrlResponse)
async def api_fetch_url(req: FetchUrlRequest):
    try:
        text = await fetch_page_text(req.url)
        return FetchUrlResponse(text=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def api_analyze(req: AnalyzeRequest):
    try:
        result = await analyze_brief(req.briefText, req.companyName)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-prompts", response_model=GeneratePromptsResponse)
async def api_generate_prompts(req: GeneratePromptsRequest):
    try:
        analysis_dict = req.analysis.model_dump(by_alias=True)
        prompts = await generate_prompts(analysis_dict)
        return GeneratePromptsResponse(prompts=prompts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-logos", response_model=GenerateLogosResponse)
async def api_generate_logos(req: GenerateLogosRequest):
    if len(req.prompts) > 8:
        raise HTTPException(status_code=400, detail="最大8プロンプトまで")
    try:
        logos = await generate_logos(req.prompts)
        return GenerateLogosResponse(logos=logos)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-proposal", response_model=GenerateProposalResponse)
async def api_generate_proposal(req: GenerateProposalRequest):
    try:
        analysis_dict = req.analysis.model_dump(by_alias=True)
        proposal = await generate_proposal(analysis_dict, req.selectedPrompt)
        return GenerateProposalResponse(proposal=proposal)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
