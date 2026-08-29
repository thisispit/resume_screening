"""Pydantic schemas for request/response models."""

from app.schemas.application import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    CandidateSummary,
)
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenOut
from app.schemas.job import JobCreate, JobOut, JobUpdate
from app.schemas.resume import JobRecommendation, ResumeOut
from app.schemas.user import UserCreate, UserOut

__all__ = [
    "ApplicationCreate",
    "ApplicationOut",
    "ApplicationUpdate",
    "CandidateSummary",
    "LoginRequest",
    "RefreshRequest",
    "RegisterRequest",
    "TokenOut",
    "JobCreate",
    "JobOut",
    "JobUpdate",
    "JobRecommendation",
    "ResumeOut",
    "UserCreate",
    "UserOut",
]
