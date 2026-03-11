"""
database.py — SQLAlchemy engine, session factory, and dependency for FastAPI.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from typing import Generator

from config import settings


# Engine & session

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,       # reconnect on stale connections
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



# Base class for all ORM models

class Base(DeclarativeBase):
    pass



# FastAPI dependency — yields a DB session per request

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
