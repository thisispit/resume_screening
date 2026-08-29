"""Job endpoints (recruiter management + public browsing)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Job
from app.schemas import JobCreate, JobOut, JobUpdate
from app.services.auth_service import CurrentUser, RequireRecruiter
from app.services.job_service import (
    ensure_job_owner,
    get_job_or_404,
    list_public_jobs,
    list_recruiter_jobs,
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    user: RequireRecruiter,
    db: Annotated[Session, Depends(get_db)],
) -> Job:
    data = payload.model_dump()
    data["company_name"] = data["company_name"] or user.company_name
    job = Job(**data, recruiter_id=user.id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=list[JobOut])
def browse_jobs(
    db: Annotated[Session, Depends(get_db)],
    search: str | None = None,
    location: str | None = None,
) -> list[Job]:
    """Public listing of active jobs with optional search/location filters."""
    return list_public_jobs(db, search=search, location=location)


@router.get("/mine", response_model=list[JobOut])
def my_jobs(
    user: RequireRecruiter,
    db: Annotated[Session, Depends(get_db)],
) -> list[Job]:
    return list_recruiter_jobs(db, user)


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: int,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Job:
    job = get_job_or_404(db, job_id)
    if not job.is_active and job.recruiter_id != user.id and user.role != "admin":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return job


@router.patch("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    payload: JobUpdate,
    user: RequireRecruiter,
    db: Annotated[Session, Depends(get_db)],
) -> Job:
    job = get_job_or_404(db, job_id)
    ensure_job_owner(job, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    user: RequireRecruiter,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    job = get_job_or_404(db, job_id)
    ensure_job_owner(job, user)
    if job.applications:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cannot delete a job that has applications — deactivate it instead",
        )
    db.delete(job)
    db.commit()
