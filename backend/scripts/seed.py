"""Seed demo data: admin, recruiter, candidate, sample jobs.

Usage:  python scripts/seed.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.enums import UserRole
from app.core.security import hash_password
from app.models import Job, User

SAMPLE_JOBS = [
    {
        "title": "Python Backend Developer",
        "description": (
            "We are looking for a Python backend developer to build and maintain REST APIs. "
            "You will work with FastAPI, PostgreSQL and Docker in an agile team. "
            "Experience with SQLAlchemy, unit testing and Git workflows is expected. "
            "Familiarity with AWS deployments is a plus."
        ),
        "required_skills": ["python", "fastapi", "postgresql", "docker", "rest api", "git"],
        "min_experience_years": 2,
        "education_level": "bachelor",
        "location": "Bengaluru",
        "employment_type": "full-time",
        "salary_min": 600000,
        "salary_max": 1200000,
    },
    {
        "title": "Frontend Engineer (React)",
        "description": (
            "Join the web team to build responsive user interfaces with React and TypeScript. "
            "You will consume REST APIs, write unit tests and collaborate with designers. "
            "Strong HTML/CSS fundamentals and experience with Git are required."
        ),
        "required_skills": ["javascript", "react", "typescript", "html/css", "git"],
        "min_experience_years": 1,
        "education_level": "bachelor",
        "location": "Remote",
        "employment_type": "full-time",
        "salary_min": 450000,
        "salary_max": 900000,
    },
    {
        "title": "Machine Learning Intern",
        "description": (
            "Assist the AI team in building NLP models for resume parsing and job matching. "
            "Work with Python, scikit-learn, pandas and deep learning frameworks like PyTorch. "
            "Ideal for candidates with strong statistics and problem-solving skills."
        ),
        "required_skills": ["python", "machine learning", "nlp", "pandas", "scikit-learn"],
        "min_experience_years": 0,
        "education_level": "bachelor",
        "location": "Hyderabad",
        "employment_type": "internship",
        "salary_min": 200000,
        "salary_max": 400000,
    },
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.query(Job).count() > 0:
            print("Database already seeded — nothing to do.")
            return

        recruiter = User(
            full_name="Priya Sharma",
            email="recruiter@demo.com",
            hashed_password=hash_password("recruiter1234"),
            role=UserRole.RECRUITER,
            company_name="TechNova Solutions",
        )
        candidate = User(
            full_name="Rahul Verma",
            email="candidate@demo.com",
            hashed_password=hash_password("candidate1234"),
            role=UserRole.CANDIDATE,
        )
        admin = User(
            full_name="Administrator",
            email=settings.SEED_ADMIN_EMAIL.lower(),
            hashed_password=hash_password(settings.SEED_ADMIN_PASSWORD),
            role=UserRole.ADMIN,
        )
        db.add_all([recruiter, candidate])
        db.flush()

        # admin may already exist via startup seeding
        existing_admin = db.query(User).filter(User.email == admin.email).first()
        if existing_admin is None:
            db.add(admin)

        for spec in SAMPLE_JOBS:
            db.add(Job(**spec, recruiter_id=recruiter.id))

        db.commit()
        print("Seeded: recruiter@demo.com / recruiter1234")
        print("        candidate@demo.com / candidate1234")
        print(f"        {settings.SEED_ADMIN_EMAIL} / {settings.SEED_ADMIN_PASSWORD}")
        print(f"        + {len(SAMPLE_JOBS)} sample jobs")


if __name__ == "__main__":
    seed()
