"""Resume schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ResumeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    file_type: str
    file_size_bytes: int

    candidate_name: str | None
    email: str | None
    phone: str | None
    location: str | None
    summary: str | None

    skills: list
    education: list
    experience: list
    projects: list
    certifications: list

    total_experience_years: float
    highest_education_level: str

    links: dict = {}
    ats_score: float = 0.0
    ats_breakdown: dict = {}

    created_at: datetime


class EducationEntry(BaseModel):
    degree: str
    institution: str | None = None
    field_of_study: str | None = None
    year: str | None = None
    grade: str | None = None
    location: str | None = None
    level: str | None = None


class ExperienceEntry(BaseModel):
    title: str | None = None
    company: str | None = None
    duration_years: float | None = None


class JobRecommendation(BaseModel):
    """A job recommended for the candidate with match breakdown."""

    job_id: int
    title: str
    company_name: str | None
    location: str | None
    employment_type: str
    required_skills: list
    min_experience_years: float

    match_score: float
    skill_score: float
    semantic_score: float
    experience_score: float
    education_score: float
    matched_skills: list
    missing_skills: list
