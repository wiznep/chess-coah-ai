"""
Application configuration — loaded from environment variables / .env file.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Stockfish -----------------------------------------------------------
    stockfish_path: str = "/usr/games/stockfish"
    engine_depth: int = 15
    engine_time_limit: float = 0.1  # seconds per move

    # --- OpenAI / OpenRouter -------------------------------------------------
    openai_api_key: str = ""
    openai_base_url: str = ""          # e.g. https://openrouter.ai/api/v1
    coach_model: str = "gpt-4o-mini"   # override via COACH_MODEL env var

    # --- Database (Phase 2) --------------------------------------------------
    database_url: str = "postgresql://postgres:postgres@localhost:5432/chesscoach"

    # --- JWT Auth (Phase 2) --------------------------------------------------
    jwt_secret_key: str = "change-me-in-production-use-a-random-64-char-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # --- Server --------------------------------------------------------------
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
