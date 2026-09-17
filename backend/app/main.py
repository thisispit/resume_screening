"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine


def _ensure_admin() -> None:
    """Seed the admin account from environment config (idempotent)."""
    from app.core.security import hash_password
    from app.core.enums import UserRole
    from app.models import User

    with SessionLocal() as db:
        if not db.query(User).filter(User.email == settings.SEED_ADMIN_EMAIL.lower()).first():
            db.add(
                User(
                    full_name="Administrator",
                    email=settings.SEED_ADMIN_EMAIL.lower(),
                    hashed_password=hash_password(settings.SEED_ADMIN_PASSWORD),
                    role=UserRole.ADMIN,
                )
            )
            db.commit()


_db_initialized = False


def init_db() -> None:
    """Initialize database tables and admin account (idempotent)."""
    global _db_initialized
    if not _db_initialized:
        upload_dir = getattr(settings, "effective_upload_dir", settings.UPLOAD_DIR)
        Path(upload_dir).mkdir(parents=True, exist_ok=True)
        try:
            Base.metadata.create_all(bind=engine)
            _ensure_admin()
        except Exception as exc:
            print(f"[main] init_db exception: {exc}")
        _db_initialized = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "REST API for an AI-powered resume screening and job matching system.\n\n"
        "* Candidates upload resumes (PDF/DOCX), get structured extraction and job recommendations.\n"
        "* Recruiters post jobs, screen applicants with explainable AI match scores and manage applications.\n"
        "* Matching combines skills overlap (45%), semantic similarity via sentence-transformers (30%), "
        "experience (15%) and education (10%)."
    ),
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def ensure_db_middleware(request, call_next):
    if not _db_initialized:
        init_db()
    return await call_next(request)


app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}
