from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "HealthHack"

    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]

    # Groq API Settings
    GROQ_API_KEY: str = ""  # Will be loaded from .env file
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()