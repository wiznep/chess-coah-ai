"""
analyzer.py — Parses a PGN string, drives the engine through every position,
computes evaluation deltas, and classifies each move.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass, field

import chess
import chess.pgn

from engine import engine_manager, score_to_centipawns

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Thresholds (in *pawns*, not centipawns) for move classification
# ------------------------------------------------------------------
INACCURACY_THRESHOLD = 0.50   # 50 cp
MISTAKE_THRESHOLD = 1.00      # 100 cp
BLUNDER_THRESHOLD = 2.00      # 200 cp


# ------------------------------------------------------------------
# Data containers
# ------------------------------------------------------------------
@dataclass
class MoveAnalysis:
    """Analysis result for a single half-move."""

    ply: int                        # 0-indexed half-move counter
    move_san: str                   # e.g. "Nf3"
    move_uci: str                   # e.g. "g1f3"
    side: str                       # "white" | "black"

    eval_before_cp: float           # centipawns (White POV)
    eval_after_cp: float            # centipawns (White POV)
    eval_drop: float                # pawns (always >= 0)

    classification: str             # "Best" | "Inaccuracy" | "Mistake" | "Blunder"
    best_move_san: str | None       # engine's preferred move (SAN)
    best_move_uci: str | None       # engine's preferred move (UCI)

    is_capture_next: bool = False   # basic tactical tag (hanging piece)
    coach_explanation: str = ""     # filled in later by coach.py


@dataclass
class GameAnalysis:
    """Full analysis payload for one game."""

    white: str = "?"
    black: str = "?"
    result: str = "*"
    moves: list[MoveAnalysis] = field(default_factory=list)


# ------------------------------------------------------------------
# Core analysis pipeline
# ------------------------------------------------------------------
async def analyze_pgn(pgn_text: str) -> GameAnalysis:
    """
    Parse *pgn_text*, evaluate every position with Stockfish, and return
    a :class:`GameAnalysis` containing per-move data.
    """
    game = chess.pgn.read_game(io.StringIO(pgn_text))
    if game is None:
        raise ValueError("Could not parse PGN — the string appears to be empty or invalid.")

    headers = game.headers
    analysis = GameAnalysis(
        white=headers.get("White", "?"),
        black=headers.get("Black", "?"),
        result=headers.get("Result", "*"),
    )

    board = game.board()
    moves = list(game.mainline_moves())

    if not moves:
        return analysis

    # --- Evaluate the starting position ------------------------------------
    prev_score, _ = await engine_manager.evaluate_position(board)
    prev_cp = score_to_centipawns(prev_score)

    for ply, move in enumerate(moves):
        side = "white" if board.turn == chess.WHITE else "black"
        move_san = board.san(move)
        move_uci = move.uci()

        # --- Get the engine's best move *before* the player moves ----------
        _, best_move = await engine_manager.evaluate_position(board)
        best_move_san: str | None = None
        best_move_uci: str | None = None
        if best_move is not None:
            best_move_san = board.san(best_move)
            best_move_uci = best_move.uci()

        # --- Play the actual move and evaluate the new position ------------
        board.push(move)
        new_score, _ = await engine_manager.evaluate_position(board)
        new_cp = score_to_centipawns(new_score)

        # --- Calculate the evaluation drop from the *mover's* perspective --
        # A positive drop means the move was bad for the player.
        if side == "white":
            drop_pawns = (prev_cp - new_cp) / 100.0
        else:
            drop_pawns = (new_cp - prev_cp) / 100.0

        drop_pawns = max(drop_pawns, 0.0)  # only penalise worse moves

        # --- Classify the move ---------------------------------------------
        classification = _classify(drop_pawns)

        # --- Basic tactical tag: hanging piece detection -------------------
        is_capture_next = False
        if drop_pawns >= BLUNDER_THRESHOLD and ply + 1 < len(moves):
            next_move = moves[ply + 1]
            if board.is_capture(next_move):
                is_capture_next = True

        analysis.moves.append(
            MoveAnalysis(
                ply=ply,
                move_san=move_san,
                move_uci=move_uci,
                side=side,
                eval_before_cp=prev_cp,
                eval_after_cp=new_cp,
                eval_drop=drop_pawns,
                classification=classification,
                best_move_san=best_move_san,
                best_move_uci=best_move_uci,
                is_capture_next=is_capture_next,
            )
        )

        prev_cp = new_cp

    return analysis


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def _classify(drop: float) -> str:
    """Map an evaluation drop (in *pawns*) to a human-readable label."""
    if drop >= BLUNDER_THRESHOLD:
        return "Blunder"
    if drop >= MISTAKE_THRESHOLD:
        return "Mistake"
    if drop >= INACCURACY_THRESHOLD:
        return "Inaccuracy"
    return "Best"
