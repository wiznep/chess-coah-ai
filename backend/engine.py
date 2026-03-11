"""
engine.py — Manages the Stockfish engine lifecycle and exposes an async
analysis helper that returns centipawn evaluations and best moves.
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import chess
import chess.engine

from config import settings

logger = logging.getLogger(__name__)


class EngineManager:
    """Thin async wrapper around python-chess's SimpleEngine."""

    def __init__(self) -> None:
        self._engine: chess.engine.SimpleEngine | None = None
        self._lock = asyncio.Lock()

    
    # Lifecycle
    
    async def start(self) -> None:
        """Spawn the Stockfish process (idempotent)."""
        if self._engine is not None:
            return
        logger.info("Starting Stockfish from %s", settings.stockfish_path)
        transport, engine = await chess.engine.popen_uci(settings.stockfish_path)
        self._engine = engine
        logger.info("Stockfish ready.")

    async def stop(self) -> None:
        """Gracefully shut down the engine."""
        if self._engine is None:
            return
        logger.info("Shutting down Stockfish …")
        try:
            await self._engine.quit()
        except Exception:
            logger.debug("Engine already closed — ignoring shutdown error.")
        self._engine = None
        logger.info("Stockfish stopped.")

    
    # Analysis
    
    async def evaluate_position(
        self,
        board: chess.Board,
    ) -> tuple[chess.engine.PovScore, chess.Move | None]:
        """
        Return *(score_from_white_pov, best_move)* for the current position.

        Uses whichever limit fires first: *depth* or *time*.
        """
        if self._engine is None:
            raise RuntimeError("Engine not started — call start() first.")

        limit = chess.engine.Limit(
            depth=settings.engine_depth,
            time=settings.engine_time_limit,
        )

        async with self._lock:
            result = await self._engine.analyse(
                board,
                limit,
                info=chess.engine.INFO_SCORE | chess.engine.INFO_PV,
            )

        score: chess.engine.PovScore = result["score"]
        # PV may be empty in terminal positions
        best_move: chess.Move | None = result.get("pv", [None])[0] if result.get("pv") else None

        return score, best_move


# Singleton shared across the application
engine_manager = EngineManager()



# Helper: convert PovScore → centipawns (from White's perspective)

def score_to_centipawns(score: chess.engine.PovScore) -> float:
    """
    Convert an engine PovScore into a float centipawn value from **White's**
    perspective.  Mate scores are mapped to ±10 000 so downstream consumers
    always get a number.
    """
    white_score = score.white()

    if white_score.is_mate():
        mate_in = white_score.mate()
        # Positive mate_in → White is winning
        return 10_000.0 if mate_in > 0 else -10_000.0

    cp = white_score.score()
    return float(cp) if cp is not None else 0.0
