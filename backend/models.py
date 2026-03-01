"""
models.py — SQLAlchemy ORM models for Phase 2.

Tables:
  - users        : authentication
  - games        : analysed games linked to a user
  - mistakes     : individual mistake/blunder records (double as puzzles)
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from database import Base


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # relationships
    games = relationship("Game", back_populates="owner", cascade="all, delete-orphan")
    mistakes = relationship("Mistake", back_populates="owner", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Game
# ---------------------------------------------------------------------------
class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pgn = Column(Text, nullable=False)
    white_player = Column(String(100), default="?")
    black_player = Column(String(100), default="?")
    result = Column(String(10), default="*")
    date_played = Column(String(20), default="")
    analysis_summary = Column(JSON, default=dict)        # {inaccuracies, mistakes, blunders}
    moves_json = Column(JSON, default=list)               # full move-by-move analysis array
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # relationships
    owner = relationship("User", back_populates="games")
    mistakes = relationship("Mistake", back_populates="game", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Mistake (also serves as Puzzle)
# ---------------------------------------------------------------------------
class Mistake(Base):
    __tablename__ = "mistakes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    move_number = Column(Integer, nullable=False)         # ply index
    color_to_move = Column(String(5), nullable=False)     # "white" | "black"
    fen_before_mistake = Column(String(100), nullable=False)  # CRITICAL for puzzles
    played_move = Column(String(10), nullable=False)      # SAN
    best_move = Column(String(10), nullable=True)         # SAN
    best_move_uci = Column(String(10), nullable=True)     # UCI for drag-drop validation
    classification = Column(String(12), nullable=False)   # Inaccuracy | Mistake | Blunder
    eval_drop = Column(Float, nullable=False)
    coach_explanation = Column(Text, default="")

    # relationships
    owner = relationship("User", back_populates="mistakes")
    game = relationship("Game", back_populates="mistakes")
