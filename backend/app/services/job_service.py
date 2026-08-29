"""Job service: CRUD helpers and access checks."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import Job, User


def get_job_or_404(db: Session, job_id: int) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return job


def ensure_job_owner(job: Job, user: User) -> None:
    if user.role != "admin" and job.recruiter_id != user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "You can only manage your own job postings"
        )


def list_public_jobs(db: Session, search: str | None = None, location: str | None = None) -> list[Job]:
    query = db.query(Job).filter(Job.is_active.is_(True))
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(or_(Job.title.ilike(like), Job.description.ilike(like)))
    if location:
        query = query.filter(Job.location.ilike(f"%{location.strip()}%"))
    return query.order_by(Job.created_at.desc()).all()


def list_recruiter_jobs(db: Session, user: User) -> list[Job]:
    return (
        db.query(Job)
        .filter(Job.recruiter_id == user.id)
        .order_by(Job.created_at.desc())
        .all()
    )
