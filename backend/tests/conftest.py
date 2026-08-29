"""Shared pytest fixtures — isolated SQLite DB per test session."""

import os
import tempfile

# Must be set BEFORE any app import (settings are read at import time).
_TMP_DIR = tempfile.mkdtemp(prefix="resume_api_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DIR}/test.db"
os.environ["SENTENCE_TRANSFORMER_MODEL"] = ""  # offline fuzzy fallback in tests
os.environ["UPLOAD_DIR"] = os.path.join(_TMP_DIR, "uploads")

import pytest  # noqa: E402
from docx import Document  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


RESUME_TEXT_PARAGRAPHS = [
    "RAHUL VERMA",
    "Bengaluru, India | +91 9876543210 | rahul.verma@example.com",
    "",
    "Summary",
    "Backend developer with 4 years of experience building REST APIs and scalable services.",
    "",
    "Skills",
    "Python, FastAPI, Django, PostgreSQL, MySQL, Docker, Git, REST API, SQL, Linux, AWS",
    "",
    "Work Experience",
    "Software Engineer at Acme Corp",
    "January 2022 - Present",
    "Built FastAPI microservices backed by PostgreSQL and deployed with Docker.",
    "",
    "Education",
    "B.Tech in Computer Science from National Institute of Technology, 2021",
    "",
    "Projects",
    "Resume Parser API: Extracted structured data from PDF resumes using Python.",
    "Job Matcher: Built a semantic job recommendation engine with sentence embeddings.",
    "",
    "Certifications",
    "AWS Certified Cloud Practitioner",
    "Deep Learning Specialization",
]


def build_resume_docx(path: str) -> None:
    doc = Document()
    for para in RESUME_TEXT_PARAGRAPHS:
        doc.add_paragraph(para)
    doc.save(path)


@pytest.fixture(scope="session")
def resume_file():
    path = os.path.join(_TMP_DIR, "rahul_verma_resume.docx")
    build_resume_docx(path)
    return path


def register(client, *, name, email, password, role):
    return client.post(
        "/api/v1/auth/register",
        json={
            "full_name": name,
            "email": email,
            "password": password,
            "role": role,
        },
    )


def login_token(client, email, password) -> str:
    res = client.post("/api/v1/auth/login-json", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
