"""
coach.py — Generates human-readable coaching explanations for mistakes
and blunders using the OpenAI Chat API.

If no OPENAI_API_KEY is configured, a deterministic *mock* explanation is
returned so the rest of the pipeline still works during local development.
"""

from __future__ import annotations

import logging

from openai import AsyncOpenAI

from analyzer import GameAnalysis
from config import settings

logger = logging.getLogger(__name__)


_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI | None:
    global _client
    if not settings.openai_api_key:
        return None
    if _client is None:
        kwargs: dict = {"api_key": settings.openai_api_key}
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        _client = AsyncOpenAI(**kwargs)
    return _client



# Prompt builder

SYSTEM_PROMPT = (
    "You are a friendly chess coach. Keep explanations short and encouraging. "
    "Never list long engine variations."
)


def _build_user_prompt(
    move_san: str,
    side: str,
    eval_before: float,
    eval_after: float,
    best_move_san: str | None,
    classification: str,
    rating: int = 1500,
) -> str:
    """Build the per-move user prompt sent to the LLM."""
    before_str = f"{eval_before / 100:+.2f}"
    after_str = f"{eval_after / 100:+.2f}"
    best = best_move_san or "unknown"

    if classification == "Best":
        return (
            f"The player (rated ~{rating}, playing as {side}) played {move_san}. "
            f"The evaluation went from {before_str} to {after_str}. "
            f"This was the best move. "
            f"Briefly explain in 2 simple sentences why this is a good move "
            f"and what it achieves strategically or tactically. Do not list long variations."
        )

    return (
        f"The player (rated ~{rating}, playing as {side}) played {move_san}. "
        f"The evaluation dropped from {before_str} to {after_str} "
        f"(classified as a {classification}). "
        f"The engine's best move was {best}. "
        f"Briefly explain in 2 simple sentences why the played move is bad "
        f"and why the engine's move is better. Do not list long variations."
    )



# Mock fallback (no API key)

def _mock_explanation(
    move_san: str,
    classification: str,
    best_move_san: str | None,
    eval_before: float,
    eval_after: float,
) -> str:
    best = best_move_san or "a better alternative"
    before_str = f"{eval_before / 100:+.2f}"
    after_str = f"{eval_after / 100:+.2f}"
    if classification == "Best":
        return (
            f"{move_san} is the best move here — the evaluation is {after_str}. "
            f"This maintains or improves your position."
        )
    return (
        f"Playing {move_san} was a {classification.lower()} — the evaluation shifted "
        f"from {before_str} to {after_str}. "
        f"Consider {best} instead, which keeps a more balanced position."
    )



# Public API

async def generate_explanations(
    analysis: GameAnalysis,
    player_rating: int = 1500,
) -> GameAnalysis:
    """
    Mutate *analysis* in place, filling in ``coach_explanation`` for every
    move.  Returns the same object.
    """
    client = _get_client()

    if client is None:
        for move in analysis.moves:
            move.coach_explanation = _mock_explanation(
                move.move_san,
                move.classification,
                move.best_move_san,
                move.eval_before_cp,
                move.eval_after_cp,
            )
        return analysis

    # --- Build all requests and fire them concurrently ---
    import asyncio

    async def _explain(move):
        user_msg = _build_user_prompt(
            move_san=move.move_san,
            side=move.side,
            eval_before=move.eval_before_cp,
            eval_after=move.eval_after_cp,
            best_move_san=move.best_move_san,
            classification=move.classification,
            rating=player_rating,
        )
        try:
            response = await client.chat.completions.create(
                model=settings.coach_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                max_tokens=150,
                temperature=0.7,
            )
            move.coach_explanation = (
                response.choices[0].message.content or ""
            ).strip()
        except Exception:
            logger.exception("LLM call failed for ply %d; using mock.", move.ply)
            move.coach_explanation = _mock_explanation(
                move.move_san,
                move.classification,
                move.best_move_san,
                move.eval_before_cp,
                move.eval_after_cp,
            )

    await asyncio.gather(*[_explain(m) for m in analysis.moves])

    return analysis
