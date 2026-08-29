"""Resume endpoints (candidate)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Resume
from app.schemas import JobRecommendation, ResumeOut
from app.services.auth_service import RequireCandidate
from app.services.resume_service import (
    create_or_replace_resume,
    delete_resume_file,
    get_resume_for_user,
)

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("/upload", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile,
    user: RequireCandidate,
    db: Annotated[Session, Depends(get_db)],
) -> Resume:
    """Upload (or replace) the candidate's resume; parses and extracts structured data."""
    return await create_or_replace_resume(db, user, file)


@router.get("/me", response_model=ResumeOut)
def get_my_resume(
    user: RequireCandidate,
    db: Annotated[Session, Depends(get_db)],
) -> Resume:
    resume = get_resume_for_user(db, user)
    if resume is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No resume uploaded yet")
    return resume


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_resume(
    user: RequireCandidate,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    resume = get_resume_for_user(db, user)
    if resume is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No resume uploaded yet")
    if resume.applications:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Cannot delete a resume that has job applications attached",
        )
    delete_resume_file(resume)
    db.delete(resume)
    db.commit()


@router.get("/me/recommendations", response_model=list[JobRecommendation])
def my_recommendations(
    user: RequireCandidate,
    db: Annotated[Session, Depends(get_db)],
    limit: int = 10,
) -> list[dict]:
    """Active jobs ranked by AI match score against the candidate's resume."""
    resume = get_resume_for_user(db, user)
    if resume is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Upload a resume first to get recommendations")
    limit = max(1, min(limit, 50))
    from app.services.resume_service import recommend_jobs

    return recommend_jobs(db, resume, limit=limit)
