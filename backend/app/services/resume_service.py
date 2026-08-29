"""Resume service: upload validation, parsing and recommendations."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.ai import PARSER_VERSION, extract_text, parse_resume
from app.ai.matcher import compute_match
from app.core.config import settings
from app.models import Job, Resume, User


def _ensure_upload_dir() -> Path:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def validate_upload(upload: UploadFile) -> str:
    """Validate extension/size; returns the normalized file type ('pdf'/'docx')."""
    original = upload.filename or "resume"
    ext = os.path.splitext(original)[1].lower()
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Only {', '.join(settings.allowed_extensions)} files are allowed",
        )
    return ext.lstrip(".")


async def save_upload(upload: UploadFile, file_type: str) -> tuple[Path, int]:
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    upload_dir = _ensure_upload_dir()
    stored_name = f"{uuid.uuid4().hex}.{file_type}"
    dest = upload_dir / stored_name
    size = 0
    with open(dest, "wb") as out:
        while chunk := await upload.read(1024 * 512):
            size += len(chunk)
            if size > max_bytes:
                out.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB limit",
                )
            out.write(chunk)
    if size == 0:
        dest.unlink(missing_ok=True)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded file is empty")
    return dest, size


def get_resume_for_user(db: Session, user: User) -> Resume | None:
    return db.query(Resume).filter(Resume.user_id == user.id).first()


def delete_resume_file(resume: Resume) -> None:
    path = Path(settings.UPLOAD_DIR) / resume.stored_filename
    path.unlink(missing_ok=True)


async def create_or_replace_resume(db: Session, user: User, upload: UploadFile) -> Resume:
    file_type = validate_upload(upload)
    existing = get_resume_for_user(db, user)

    dest, size_bytes = await save_upload(upload, file_type)
    try:
        raw_text = extract_text(str(dest), file_type)
        parsed = parse_resume(raw_text)
    except Exception:
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Could not read the resume — is it a valid PDF/DOCX?",
        ) from None

    if existing is not None:
        delete_resume_file(existing)
        db.delete(existing)
        db.flush()

    resume = Resume(
        user_id=user.id,
        original_filename=upload.filename or f"resume.{file_type}",
        stored_filename=dest.name,
        file_type=file_type,
        file_size_bytes=size_bytes,
        raw_text=raw_text,
        parser_version=PARSER_VERSION,
        **parsed,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def recommend_jobs(db: Session, resume: Resume, limit: int = 10) -> list[dict]:
    """Rank active jobs against the candidate's resume."""
    jobs = db.query(Job).filter(Job.is_active.is_(True)).all()
    scored: list[dict] = []
    for job in jobs:
        result = compute_match(
            raw_text=resume.raw_text,
            candidate_skills=resume.skills or [],
            total_experience_years=resume.total_experience_years or 0.0,
            highest_education_level=resume.highest_education_level,
            job_description=job.description,
            required_skills=job.required_skills or [],
            min_experience_years=job.min_experience_years or 0.0,
            education_level=job.education_level,
        )
        item = result.as_dict()
        item.update(
            {
                "job_id": job.id,
                "title": job.title,
                "company_name": job.company_name,
                "location": job.location,
                "employment_type": job.employment_type,
                "required_skills": job.required_skills or [],
                "min_experience_years": job.min_experience_years,
            }
        )
        scored.append(item)
    scored.sort(key=lambda entry: entry["match_score"], reverse=True)
    return scored[:limit]
