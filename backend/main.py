"""
main.py — FastAPI application entry-point.

Run with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from analyzer import GameAnalysis, MoveAnalysis, analyze_pgn
from coach import generate_explanations
from config import settings
from engine import engine_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Application lifespan — start / stop the engine
# ------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    await engine_manager.start()
    yield
    await engine_manager.stop()


app = FastAPI(
    title="AI Chess Coach",
    version="0.1.0",
    lifespan=lifespan,
)

# --- CORS (allow the Vite dev server) ----------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------
# Request / Response schemas
# ------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    pgn: str = Field(..., min_length=1, description="PGN text of the game to analyse.")
    player_rating: int = Field(
        1500,
        ge=100,
        le=3500,
        description="Approximate rating of the player for coaching prompts.",
    )


class MoveResponse(BaseModel):
    ply: int
    move_san: str
    move_uci: str
    side: str
    eval_before_cp: float
    eval_after_cp: float
    eval_drop: float
    classification: str
    best_move_san: str | None
    best_move_uci: str | None
    is_capture_next: bool
    coach_explanation: str


class AnalyzeResponse(BaseModel):
    white: str
    black: str
    result: str
    moves: list[MoveResponse]


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------
@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Accept a PGN string, run engine analysis + coaching pipeline,
    and return the full result.
    """
    try:
        analysis: GameAnalysis = await analyze_pgn(request.pgn)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        logger.exception("Engine analysis failed")
        raise HTTPException(status_code=500, detail="Engine analysis failed.")

    # --- Generate coaching text for mistakes / blunders --------------------
    try:
        analysis = await generate_explanations(analysis, player_rating=request.player_rating)
    except Exception:
        logger.exception("Coach explanation generation failed")
        # Non-fatal — we still return evals without coaching text

    return AnalyzeResponse(
        white=analysis.white,
        black=analysis.black,
        result=analysis.result,
        moves=[
            MoveResponse(
                ply=m.ply,
                move_san=m.move_san,
                move_uci=m.move_uci,
                side=m.side,
                eval_before_cp=m.eval_before_cp,
                eval_after_cp=m.eval_after_cp,
                eval_drop=m.eval_drop,
                classification=m.classification,
                best_move_san=m.best_move_san,
                best_move_uci=m.best_move_uci,
                is_capture_next=m.is_capture_next,
                coach_explanation=m.coach_explanation,
            )
            for m in analysis.moves
        ],
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
