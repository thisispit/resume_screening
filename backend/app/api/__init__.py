"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.routes import applications, auth, jobs, resumes

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(resumes.router)
api_router.include_router(jobs.router)
api_router.include_router(applications.router)

__all__ = ["api_router"]
