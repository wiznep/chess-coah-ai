"""
Application configuration — loaded from environment variables / .env file.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Stockfish -----------------------------------------------------------
    stockfish_path: str = "/usr/games/stockfish"
    engine_depth: int = 15
    engine_time_limit: float = 0.1  # seconds per move

    # --- OpenAI --------------------------------------------------------------
    openai_api_key: str = ""

    # --- Server --------------------------------------------------------------
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
