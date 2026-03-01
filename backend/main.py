"""
main.py — FastAPI application entry-point (Phase 2).

Run with:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from dataclasses import asdict

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from analyzer import GameAnalysis, MoveAnalysis, analyze_pgn
from auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from coach import generate_explanations
from config import settings
from database import Base, engine as db_engine, get_db
from engine import engine_manager
from models import Game, Mistake, User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Application lifespan — start / stop engine + create DB tables
# ------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist
    Base.metadata.create_all(bind=db_engine)
    await engine_manager.start()
    yield
    await engine_manager.stop()


app = FastAPI(
    title="AI Chess Coach",
    version="0.2.0",
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


# ======================================================================
# Pydantic Schemas
# ======================================================================

# --- Auth ---
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# --- Analysis ---
class AnalyzeRequest(BaseModel):
    pgn: str = Field(..., min_length=1, description="PGN text of the game to analyse.")
    player_rating: int = Field(
        1500, ge=100, le=3500,
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
    fen_before: str
    is_capture_next: bool
    coach_explanation: str


class AnalyzeResponse(BaseModel):
    id: int                    # game DB id
    white: str
    black: str
    result: str
    moves: list[MoveResponse]


# --- Game library ---
class GameSummary(BaseModel):
    id: int
    white_player: str
    black_player: str
    result: str
    date_played: str
    analysis_summary: dict
    created_at: str


class GameDetail(BaseModel):
    id: int
    white_player: str
    black_player: str
    result: str
    pgn: str
    date_played: str
    analysis_summary: dict
    moves: list[MoveResponse]
    mistakes: list[dict]


# --- Analytics ---
class AnalyticsResponse(BaseModel):
    total_games: int
    total_moves: int
    inaccuracies: int
    mistakes: int
    blunders: int
    games_over_time: list[dict]


# --- Puzzles ---
class PuzzleResponse(BaseModel):
    id: int
    game_id: int
    move_number: int
    color_to_move: str
    fen_before_mistake: str
    played_move: str
    best_move: str | None
    best_move_uci: str | None
    classification: str
    eval_drop: float
    coach_explanation: str


# ======================================================================
# AUTH ENDPOINTS
# ======================================================================

@app.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user account and return an access token."""
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken.")

    user = User(username=body.username, hashed_password=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": user.username})
    return TokenResponse(access_token=token, username=user.username)


@app.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_access_token(data={"sub": user.username})
    return TokenResponse(access_token=token, username=user.username)


# ======================================================================
# ANALYSIS ENDPOINT (now protected + persists to DB)
# ======================================================================

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Accept a PGN string, run engine analysis + coaching pipeline,
    persist the game & mistakes, and return the full result.
    """
    # --- Engine analysis ---------------------------------------------------
    try:
        analysis: GameAnalysis = await analyze_pgn(request.pgn)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        logger.exception("Engine analysis failed")
        raise HTTPException(status_code=500, detail="Engine analysis failed.")

    # --- Coaching text -----------------------------------------------------
    try:
        analysis = await generate_explanations(analysis, player_rating=request.player_rating)
    except Exception:
        logger.exception("Coach explanation generation failed")

    # --- Build summary stats -----------------------------------------------
    summary = {
        "inaccuracies": sum(1 for m in analysis.moves if m.classification == "Inaccuracy"),
        "mistakes": sum(1 for m in analysis.moves if m.classification == "Mistake"),
        "blunders": sum(1 for m in analysis.moves if m.classification == "Blunder"),
        "total_moves": len(analysis.moves),
    }

    # --- Persist game to DB -----------------------------------------------
    moves_dicts = [asdict(m) for m in analysis.moves]
    game = Game(
        user_id=current_user.id,
        pgn=request.pgn,
        white_player=analysis.white,
        black_player=analysis.black,
        result=analysis.result,
        analysis_summary=summary,
        moves_json=moves_dicts,
    )
    db.add(game)
    db.flush()  # get game.id before inserting mistakes

    # --- Persist mistakes / blunders as puzzle records ----------------------
    for m in analysis.moves:
        if m.classification in ("Inaccuracy", "Mistake", "Blunder"):
            mistake = Mistake(
                user_id=current_user.id,
                game_id=game.id,
                move_number=m.ply,
                color_to_move=m.side,
                fen_before_mistake=m.fen_before,
                played_move=m.move_san,
                best_move=m.best_move_san,
                best_move_uci=m.best_move_uci,
                classification=m.classification,
                eval_drop=m.eval_drop,
                coach_explanation=m.coach_explanation,
            )
            db.add(mistake)

    db.commit()
    db.refresh(game)

    # --- Return response ---------------------------------------------------
    return AnalyzeResponse(
        id=game.id,
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
                fen_before=m.fen_before,
                is_capture_next=m.is_capture_next,
                coach_explanation=m.coach_explanation,
            )
            for m in analysis.moves
        ],
    )


# ======================================================================
# GAME LIBRARY ENDPOINTS
# ======================================================================

@app.get("/games", response_model=list[GameSummary])
def list_games(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all analysed games for the current user."""
    games = (
        db.query(Game)
        .filter(Game.user_id == current_user.id)
        .order_by(Game.created_at.desc())
        .all()
    )
    return [
        GameSummary(
            id=g.id,
            white_player=g.white_player,
            black_player=g.black_player,
            result=g.result,
            date_played=g.date_played or "",
            analysis_summary=g.analysis_summary or {},
            created_at=g.created_at.isoformat() if g.created_at else "",
        )
        for g in games
    ]


@app.get("/games/{game_id}", response_model=GameDetail)
def get_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return full details for a specific game including move analysis."""
    game = (
        db.query(Game)
        .filter(Game.id == game_id, Game.user_id == current_user.id)
        .first()
    )
    if not game:
        raise HTTPException(status_code=404, detail="Game not found.")

    # Build move responses from stored JSON
    moves_data = game.moves_json or []
    move_responses = [
        MoveResponse(
            ply=m.get("ply", 0),
            move_san=m.get("move_san", ""),
            move_uci=m.get("move_uci", ""),
            side=m.get("side", ""),
            eval_before_cp=m.get("eval_before_cp", 0),
            eval_after_cp=m.get("eval_after_cp", 0),
            eval_drop=m.get("eval_drop", 0),
            classification=m.get("classification", "Best"),
            best_move_san=m.get("best_move_san"),
            best_move_uci=m.get("best_move_uci"),
            fen_before=m.get("fen_before", ""),
            is_capture_next=m.get("is_capture_next", False),
            coach_explanation=m.get("coach_explanation", ""),
        )
        for m in moves_data
    ]

    # Mistakes for this game
    mistakes = (
        db.query(Mistake)
        .filter(Mistake.game_id == game.id)
        .order_by(Mistake.move_number)
        .all()
    )
    mistakes_list = [
        {
            "id": mk.id,
            "move_number": mk.move_number,
            "color_to_move": mk.color_to_move,
            "fen_before_mistake": mk.fen_before_mistake,
            "played_move": mk.played_move,
            "best_move": mk.best_move,
            "classification": mk.classification,
            "eval_drop": mk.eval_drop,
            "coach_explanation": mk.coach_explanation,
        }
        for mk in mistakes
    ]

    return GameDetail(
        id=game.id,
        white_player=game.white_player,
        black_player=game.black_player,
        result=game.result,
        pgn=game.pgn,
        date_played=game.date_played or "",
        analysis_summary=game.analysis_summary or {},
        moves=move_responses,
        mistakes=mistakes_list,
    )


# ======================================================================
# ANALYTICS ENDPOINT
# ======================================================================

@app.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate mistake data across all games for the dashboard."""
    games = db.query(Game).filter(Game.user_id == current_user.id).all()

    total_moves = 0
    inaccuracies = 0
    mistakes_count = 0
    blunders = 0
    games_over_time = []

    for g in games:
        s = g.analysis_summary or {}
        total_moves += s.get("total_moves", 0)
        inaccuracies += s.get("inaccuracies", 0)
        mistakes_count += s.get("mistakes", 0)
        blunders += s.get("blunders", 0)
        games_over_time.append({
            "date": g.created_at.isoformat() if g.created_at else "",
            "white": g.white_player,
            "black": g.black_player,
            "result": g.result,
            "inaccuracies": s.get("inaccuracies", 0),
            "mistakes": s.get("mistakes", 0),
            "blunders": s.get("blunders", 0),
        })

    return AnalyticsResponse(
        total_games=len(games),
        total_moves=total_moves,
        inaccuracies=inaccuracies,
        mistakes=mistakes_count,
        blunders=blunders,
        games_over_time=games_over_time,
    )


# ======================================================================
# PUZZLES ENDPOINT
# ======================================================================

@app.get("/puzzles", response_model=list[PuzzleResponse])
def get_puzzles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all Mistake/Blunder records as puzzles for the current user."""
    records = (
        db.query(Mistake)
        .filter(
            Mistake.user_id == current_user.id,
            Mistake.classification.in_(["Mistake", "Blunder"]),
        )
        .order_by(Mistake.id.desc())
        .all()
    )
    return [
        PuzzleResponse(
            id=r.id,
            game_id=r.game_id,
            move_number=r.move_number,
            color_to_move=r.color_to_move,
            fen_before_mistake=r.fen_before_mistake,
            played_move=r.played_move,
            best_move=r.best_move,
            best_move_uci=r.best_move_uci,
            classification=r.classification,
            eval_drop=r.eval_drop,
            coach_explanation=r.coach_explanation or "",
        )
        for r in records
    ]


# ======================================================================
# HEALTH CHECK
# ======================================================================

@app.get("/health")
async def health():
    return {"status": "ok"}
