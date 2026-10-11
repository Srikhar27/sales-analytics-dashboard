"""Application configuration settings."""

from typing import List, Union
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    DATABASE_URL: str = "sqlite:///./data/sales.db"
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000"
    ]
    MAX_FILE_SIZE_MB: int = 50
    APP_NAME: str = "Sales Analytics Dashboard"
    DEBUG: bool = False

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins whether provided as list, JSON string, or comma-separated."""
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [i.strip() for i in v_stripped.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(item) for item in v]
        return ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
