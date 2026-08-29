# AI Resume Screening & Job Matching

An AI-powered resume screening and job matching system for B.Tech project.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **Database:** SQLite

## Project Structure

```
ai-resume-screening/
├── frontend/          # React frontend
├── backend/           # FastAPI backend
├── README.md
└── .gitignore
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (source .venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
copy .env.example .env          # edit DATABASE_URL / SECRET_KEY
python -m alembic upgrade head  # create tables
python scripts/seed.py          # optional: demo accounts + sample jobs
uvicorn app.main:app --reload
```

Interactive API docs: http://localhost:8000/api/v1/docs

### Demo Accounts (after seeding)

| Role      | Email               | Password       |
| --------- | ------------------- | -------------- |
| Recruiter | recruiter@demo.com  | recruiter1234  |
| Candidate | candidate@demo.com  | candidate1234  |
| Admin     | admin@demo.com      | admin1234      |

## API Overview

- `POST /api/v1/auth/register` — sign up as candidate or recruiter
- `POST /api/v1/auth/login-json` — login, returns JWT tokens
- `POST /api/v1/resumes/upload` — upload resume (PDF/DOCX), parsed with AI extraction
- `GET  /api/v1/resumes/me/recommendations` — ranked job recommendations for your resume
- `POST /api/v1/jobs` — recruiters post jobs (required skills, min experience, education)
- `GET  /api/v1/jobs` — browse/search active jobs
- `POST /api/v1/applications` — apply to a job; stores explainable match-score breakdown
- `GET  /api/v1/applications/job/{id}` — recruiters see applicants ranked by match score
- `PATCH /api/v1/applications/{id}` — update status/notes (applied → hired pipeline)

## Features

- Resume upload and text extraction
- Resume-job matching
- ATS scoring
- Skill gap analysis
- Candidate ranking
- AI-powered semantic matching

## Note

This is a recruitment decision-support tool. It does not make hiring decisions.
