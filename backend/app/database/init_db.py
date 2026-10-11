"""Database table initialization helper."""

import os
from app.database.connection import engine, Base
from app.core.config import settings
import app.models.sales  # Ensure models are registered


def init_db() -> None:
    """Create all database tables and ensure storage directories exist."""
    if settings.DATABASE_URL.startswith("sqlite:///"):
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        dir_name = os.path.dirname(db_path)
        if dir_name:
            os.makedirs(dir_name, exist_ok=True)
    Base.metadata.create_all(bind=engine)
