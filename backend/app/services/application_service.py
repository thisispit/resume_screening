"""Application service: applying, screening and status management."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.ai.matcher import compute_match
from app.core.enums import ApplicationStatus
from app.models import Application, Job, Resume, User
from app.services.job_service import ensure_job_owner
from app.services.resume_service import _build_resume_context, get_resume_for_user


def apply_to_job(db: Session, user: User, job: Job, cover_letter: str | None) -> Application:
    if not job.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This job is no longer accepting applications")

    resume = get_resume_for_user(db, user)
    if resume is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Upload a resume before applying to jobs",
        )

    existing = (
        db.query(Application)
        .filter(Application.job_id == job.id, Application.candidate_id == user.id)
        .first()
    )
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "You have already applied to this job")

    result = compute_match(
        raw_text=resume.raw_text,
        candidate_skills=resume.skills or [],
        total_experience_years=resume.total_experience_years or 0.0,
        highest_education_level=resume.highest_education_level,
        job_description=job.description,
        required_skills=job.required_skills or [],
        min_experience_years=job.min_experience_years or 0.0,
        education_level=job.education_level,
        resume_context=_build_resume_context(resume),
    )

    application = Application(
        job_id=job.id,
        candidate_id=user.id,
        resume_id=resume.id,
        cover_letter=cover_letter,
        **result.as_dict(),
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def list_candidate_applications(db: Session, user: User) -> list[Application]:
    return (
        db.query(Application)
        .options(joinedload(Application.job))
        .filter(Application.candidate_id == user.id)
        .order_by(Application.created_at.desc())
        .all()
    )


def list_job_applicants_ranked(db: Session, job: Job) -> list[Application]:
    """Applicants for a job, ranked by AI match score (best first)."""
    return (
        db.query(Application)
        .filter(Application.job_id == job.id)
        .order_by(Application.match_score.desc(), Application.created_at.asc())
        .all()
    )


def update_application(
    db: Session, application: Application, *, new_status: ApplicationStatus | None, notes: str | None
) -> Application:
    if new_status is not None:
        application.status = new_status
    if notes is not None:
        application.notes = notes
    db.commit()
    db.refresh(application)
    return application


def candidate_summary(db: Session, application: Application) -> dict:
    candidate = db.get(User, application.candidate_id)
    resume = db.get(Resume, application.resume_id)
    ats_score = getattr(resume, "ats_score", 0.0) if resume else 0.0
    return {
        "application": application,
        "candidate_name": candidate.full_name if candidate else "Unknown",
        "candidate_email": candidate.email if candidate else "",
        "resume_skills": (resume.skills or []) if resume else [],
        "total_experience_years": (resume.total_experience_years or 0.0) if resume else 0.0,
        "resume_ats_score": ats_score or 0.0,
        "highest_education_level": (resume.highest_education_level or None) if resume else None,
        "resume_location": (resume.location or None) if resume else None,
        "resume_links": (resume.links or {}) if resume else {},
    }
