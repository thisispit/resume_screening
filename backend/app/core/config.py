"""Application configuration loaded from environment variables (.env)."""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "AI Resume Screening & Job Matching API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/resume_screening"

    # Security
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    ALLOWED_EXTENSIONS: str = ".pdf,.docx"

    # AI
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    SPACY_MODEL: str = "en_core_web_sm"

    WEIGHT_SKILLS: float = 0.45
    WEIGHT_SEMANTIC: float = 0.30
    WEIGHT_EXPERIENCE: float = 0.15
    WEIGHT_EDUCATION: float = 0.10

    # Optional LLM (OpenAI-compatible chat-completions API).
    # Leave LLM_API_KEY empty and the app runs fully offline using the
    # heuristic parser + local embeddings. Add a key later to switch to
    # high-accuracy LLM parsing and matching — no code changes needed.
    LLM_PROVIDER: str = "groq"  # groq | openrouter | openai | gemini
    LLM_API_KEY: str = ""
    LLM_MODEL: str = ""  # empty -> provider default
    LLM_BASE_URL: str = ""  # empty -> provider default
    LLM_TIMEOUT_SECONDS: int = 90
    USE_LLM_MATCHING: bool = True

    # Seed
    SEED_ADMIN_EMAIL: str = "admin@demo.com"
    SEED_ADMIN_PASSWORD: str = "admin1234"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_extensions(self) -> list[str]:
        return [
            e.strip().lower() for e in self.ALLOWED_EXTENSIONS.split(",") if e.strip()
        ]

    @field_validator("DATABASE_URL")
    @classmethod
    def _fix_driver(cls, v: str) -> str:
        # Accept plain postgresql:// URLs and force the psycopg (v3) driver.
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
