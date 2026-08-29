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
    {
        "title": "Data Scientist",
        "description": (
            "Design and build predictive models and dashboards from large datasets. "
            "You will use Python, SQL and machine learning libraries like scikit-learn, "
            "TensorFlow or PyTorch to solve real business problems."
        ),
        "required_skills": ["python", "machine learning", "sql", "tensorflow", "data visualization", "statistics"],
        "min_experience_years": 3,
        "education_level": "bachelor",
        "location": "Bengaluru",
        "employment_type": "full-time",
        "salary_min": 1000000,
        "salary_max": 2000000,
    },
    {
        "title": "Data Analyst",
        "description": (
            "Analyze business data, build reports and dashboards using SQL, Excel and "
            "visualization tools. Strong communication and attention to detail required."
        ),
        "required_skills": ["sql", "excel", "power bi", "data analysis", "python"],
        "min_experience_years": 1,
        "education_level": "bachelor",
        "location": "Pune",
        "employment_type": "full-time",
        "salary_min": 500000,
        "salary_max": 900000,
    },
    {
        "title": "DevOps Engineer",
        "description": (
            "Manage cloud infrastructure on AWS or Azure using Docker, Kubernetes and CI/CD "
            "pipelines. Automate deployments and improve system reliability."
        ),
        "required_skills": ["aws", "docker", "kubernetes", "terraform", "ci/cd", "linux"],
        "min_experience_years": 3,
        "education_level": "bachelor",
        "location": "Bengaluru",
        "employment_type": "full-time",
        "salary_min": 1200000,
        "salary_max": 2200000,
    },
    {
        "title": "UI/UX Designer",
        "description": (
            "Design intuitive user interfaces and interactions using Figma and prototyping "
            "tools. Collaborate with developers to ship polished, accessible products."
        ),
        "required_skills": ["figma", "ui design", "ux design", "prototyping", "adobe xd", "css"],
        "min_experience_years": 2,
        "education_level": "bachelor",
        "location": "Mumbai",
        "employment_type": "full-time",
        "salary_min": 600000,
        "salary_max": 1400000,
    },
    {
        "title": "Full Stack Developer",
        "description": (
            "Build end-to-end web applications with React, Node.js and a SQL database. "
            "Own features from backend APIs to polished frontend UI."
        ),
        "required_skills": ["react", "node.js", "javascript", "postgresql", "rest api", "git"],
        "min_experience_years": 2,
        "education_level": "bachelor",
        "location": "Remote",
        "employment_type": "full-time",
        "salary_min": 700000,
        "salary_max": 1500000,
    },
    {
        "title": "Mobile App Developer (Android)",
        "description": (
            "Develop native Android applications with Kotlin or Java. Integrate REST APIs, "
            "handle offline storage and publish to the Play Store."
        ),
        "required_skills": ["android", "kotlin", "java", "rest api", "sqlite"],
        "min_experience_years": 2,
        "education_level": "bachelor",
        "location": "Delhi",
        "employment_type": "full-time",
        "salary_min": 700000,
        "salary_max": 1300000,
    },
    {
        "title": "Cybersecurity Analyst",
        "description": (
            "Monitor systems for security threats, perform penetration testing and respond "
            "to incidents. Knowledge of network security, SIEM tools and risk assessment."
        ),
        "required_skills": ["network security", "penetration testing", "siem", "linux", "firewalls"],
        "min_experience_years": 3,
        "education_level": "bachelor",
        "location": "Gurugram",
        "employment_type": "full-time",
        "salary_min": 900000,
        "salary_max": 1800000,
    },
    {
        "title": "Cloud Engineer",
        "description": (
            "Design and manage scalable cloud solutions on AWS, Azure or GCP. Automate "
            "infrastructure with Terraform and monitor application health."
        ),
        "required_skills": ["aws", "azure", "gcp", "terraform", "docker", "kubernetes"],
        "min_experience_years": 3,
        "education_level": "bachelor",
        "location": "Hyderabad",
        "employment_type": "full-time",
        "salary_min": 1000000,
        "salary_max": 1900000,
    },
    {
        "title": "Project Manager",
        "description": (
            "Lead cross-functional teams to deliver software projects on time and within "
            "budget. Strong communication, Agile/Scrum experience and stakeholder management."
        ),
        "required_skills": ["project management", "agile", "scrum", "jira", "communication"],
        "min_experience_years": 4,
        "education_level": "bachelor",
        "location": "Bengaluru",
        "employment_type": "full-time",
        "salary_min": 1500000,
        "salary_max": 2500000,
    },
    {
        "title": "QA Engineer",
        "description": (
            "Design and execute test plans, automate regression tests and ensure product "
            "quality. Experience with Selenium, manual testing and bug tracking tools."
        ),
        "required_skills": ["qa", "selenium", "automation testing", "manual testing", "jira", "sql"],
        "min_experience_years": 1,
        "education_level": "bachelor",
        "location": "Chennai",
        "employment_type": "full-time",
        "salary_min": 400000,
        "salary_max": 800000,
    },
    {
        "title": "Database Administrator",
        "description": (
            "Manage and optimize PostgreSQL and MySQL databases, handle backups, replication "
            "and performance tuning. Strong SQL and Linux skills required."
        ),
        "required_skills": ["postgresql", "mysql", "sql", "database administration", "linux", "backup"],
        "min_experience_years": 3,
        "education_level": "bachelor",
        "location": "Pune",
        "employment_type": "full-time",
        "salary_min": 800000,
        "salary_max": 1500000,
    },
    {
        "title": "Graphic Designer",
        "description": (
            "Create engaging visuals, brand assets and marketing material using Photoshop "
            "and Illustrator. A strong portfolio and design fundamentals are essential."
        ),
        "required_skills": ["photoshop", "illustrator", "graphic design", "branding", "figma"],
        "min_experience_years": 1,
        "education_level": "bachelor",
        "location": "Mumbai",
        "employment_type": "full-time",
        "salary_min": 350000,
        "salary_max": 800000,
    },
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        recruiter = db.query(User).filter(User.email == "recruiter@demo.com").first()
        if recruiter is None:
            recruiter = User(
                full_name="Priya Sharma",
                email="recruiter@demo.com",
                hashed_password=hash_password("recruiter1234"),
                role=UserRole.RECRUITER,
                company_name="TechNova Solutions",
            )
            db.add(recruiter)
            db.flush()

        candidate = db.query(User).filter(User.email == "candidate@demo.com").first()
        if candidate is None:
            candidate = User(
                full_name="Rahul Verma",
                email="candidate@demo.com",
                hashed_password=hash_password("candidate1234"),
                role=UserRole.CANDIDATE,
            )
            db.add(candidate)
            db.flush()

        admin = User(
            full_name="Administrator",
            email=settings.SEED_ADMIN_EMAIL.lower(),
            hashed_password=hash_password(settings.SEED_ADMIN_PASSWORD),
            role=UserRole.ADMIN,
        )
        existing_admin = db.query(User).filter(User.email == admin.email).first()
        if existing_admin is None:
            db.add(admin)

        added = 0
        for spec in SAMPLE_JOBS:
            exists = (
                db.query(Job)
                .filter(Job.title.ilike(spec["title"]), Job.recruiter_id == recruiter.id)
                .first()
            )
            if exists is None:
                db.add(Job(**spec, recruiter_id=recruiter.id))
                added += 1

        db.commit()
        print("Seeded: recruiter@demo.com / recruiter1234")
        print("        candidate@demo.com / candidate1234")
        print(f"        {settings.SEED_ADMIN_EMAIL} / {settings.SEED_ADMIN_PASSWORD}")
        print(f"        + {added} new sample jobs added")


if __name__ == "__main__":
    seed()
