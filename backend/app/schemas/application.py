"""Application schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import ApplicationStatus
from app.schemas.job import JobOut


class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: str | None = Field(default=None, max_length=5000)


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    notes: str | None = Field(default=None, max_length=5000)


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    candidate_id: int
    resume_id: int
    status: ApplicationStatus

    match_score: float
    skill_score: float
    semantic_score: float
    experience_score: float
    education_score: float
    matched_skills: list
    missing_skills: list

    cover_letter: str | None
    notes: str | None
    created_at: datetime
    job: JobOut | None = None


class CandidateSummary(BaseModel):
    """Candidate info joined onto an application for recruiter views."""

    application: ApplicationOut
    candidate_name: str
    candidate_email: str
    resume_skills: list
    total_experience_years: float
    resume_ats_score: float = 0.0
    highest_education_level: str | None = None
    resume_location: str | None = None
    resume_links: dict | None = None
