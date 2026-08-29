"""Job schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobBase(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    company_name: str | None = Field(default=None, max_length=150)
    description: str = Field(min_length=20)
    required_skills: list[str] = Field(min_length=1)
    min_experience_years: float = Field(default=0.0, ge=0, le=50)
    education_level: str = Field(default="bachelor", max_length=20)
    location: str | None = Field(default=None, max_length=150)
    employment_type: str = Field(default="full-time", max_length=50)
    salary_min: float | None = Field(default=None, ge=0)
    salary_max: float | None = Field(default=None, ge=0)


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    company_name: str | None = Field(default=None, max_length=150)
    description: str | None = Field(default=None, min_length=20)
    required_skills: list[str] | None = None
    min_experience_years: float | None = Field(default=None, ge=0, le=50)
    education_level: str | None = Field(default=None, max_length=20)
    location: str | None = Field(default=None, max_length=150)
    employment_type: str | None = Field(default=None, max_length=50)
    salary_min: float | None = Field(default=None, ge=0)
    salary_max: float | None = Field(default=None, ge=0)
    is_active: bool | None = None


class JobOut(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recruiter_id: int
    is_active: bool
    created_at: datetime
