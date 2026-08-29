"""Application endpoints (candidate apply + recruiter screening)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Application
from app.schemas import (
    ApplicationCreate,
    ApplicationOut,
    ApplicationUpdate,
    CandidateSummary,
)
from app.services.application_service import (
    apply_to_job,
    candidate_summary,
    list_candidate_applications,
    list_job_applicants_ranked,
    update_application,
)
from app.services.auth_service import RequireCandidate, RequireRecruiter
from app.services.job_service import ensure_job_owner, get_job_or_404

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def apply(
    payload: ApplicationCreate,
    user: RequireCandidate,
    db: Annotated[Session, Depends(get_db)],
) -> Application:
    """Apply to a job; the AI match snapshot is computed from your resume."""
    job = get_job_or_404(db, payload.job_id)
    return apply_to_job(db, user, job, payload.cover_letter)


@router.get("/me", response_model=list[ApplicationOut])
def my_applications(
    user: RequireCandidate,
    db: Annotated[Session, Depends(get_db)],
) -> list[Application]:
    return list_candidate_applications(db, user)


@router.get("/job/{job_id}", response_model=list[CandidateSummary])
def job_applicants(
    job_id: int,
    user: RequireRecruiter,
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    """Ranked applicants for one of your jobs (best AI match first)."""
    job = get_job_or_404(db, job_id)
    ensure_job_owner(job, user)
    return [candidate_summary(db, app) for app in list_job_applicants_ranked(db, job)]


@router.patch("/{application_id}", response_model=ApplicationOut)
def review_application(
    application_id: int,
    payload: ApplicationUpdate,
    user: RequireRecruiter,
    db: Annotated[Session, Depends(get_db)],
) -> Application:
    """Recruiter updates application status / notes."""
    application = db.get(Application, application_id)
    if application is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    job = get_job_or_404(db, application.job_id)
    ensure_job_owner(job, user)
    return update_application(
        db,
        application,
        new_status=payload.status,
        notes=payload.notes,
    )
