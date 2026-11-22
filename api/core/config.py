from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    MODEL_DIR: str = "./model"
    MODEL_FILENAME: str = "model.pt"
    MAX_SEQ_LENGTH: int = 256
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "hackathon-secret-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()