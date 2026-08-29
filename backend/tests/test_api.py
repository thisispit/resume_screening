"""End-to-end API tests: register -> login -> upload resume -> jobs -> apply -> screen."""

from tests.conftest import auth_header, login_token, register

CANDIDATE = {
    "name": "Rahul Verma",
    "email": "rahul@example.com",
    "password": "candidate1234",
    "role": "candidate",
}
RECRUITER = {
    "name": "Priya Sharma",
    "email": "priya@technova.com",
    "password": "recruiter1234",
    "role": "recruiter",
}

JOB_PAYLOAD = {
    "title": "Python Backend Developer",
    "description": (
        "Build and maintain REST APIs with Python and FastAPI. Work with PostgreSQL, "
        "Docker and Git in an agile team. Testing and Linux skills expected."
    ),
    "required_skills": ["python", "fastapi", "postgresql", "docker", "git"],
    "min_experience_years": 2,
    "education_level": "bachelor",
    "location": "Bengaluru",
}


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_register_and_login(client):
    res = register(client, **RECRUITER)
    assert res.status_code == 201
    assert res.json()["role"] == "recruiter"

    # duplicate email rejected
    assert register(client, **RECRUITER).status_code == 409

    token = login_token(client, RECRUITER["email"], RECRUITER["password"])
    me = client.get("/api/v1/auth/me", headers=auth_header(token))
    assert me.status_code == 200
    assert me.json()["email"] == RECRUITER["email"]

    # bad password rejected
    bad = client.post(
        "/api/v1/auth/login-json",
        json={"email": RECRUITER["email"], "password": "wrong-password"},
    )
    assert bad.status_code == 401


def test_register_candidate(client):
    res = register(client, **CANDIDATE)
    assert res.status_code == 201


def test_recruiter_creates_job(client):
    token = login_token(client, RECRUITER["email"], RECRUITER["password"])
    res = client.post("/api/v1/jobs", json=JOB_PAYLOAD, headers=auth_header(token))
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["title"] == JOB_PAYLOAD["title"]
    assert body["required_skills"] == JOB_PAYLOAD["required_skills"]


def test_candidate_cannot_create_job(client):
    token = login_token(client, CANDIDATE["email"], CANDIDATE["password"])
    res = client.post("/api/v1/jobs", json=JOB_PAYLOAD, headers=auth_header(token))
    assert res.status_code == 403


def test_browse_jobs_public(client):
    res = client.get("/api/v1/jobs", params={"search": "Python"})
    assert res.status_code == 200
    titles = [job["title"] for job in res.json()]
    assert "Python Backend Developer" in titles


def test_upload_resume_and_analysis(client, resume_file):
    token = login_token(client, CANDIDATE["email"], CANDIDATE["password"])
    with open(resume_file, "rb") as fh:
        res = client.post(
            "/api/v1/resumes/upload",
            files={"file": ("rahul_verma.docx", fh, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            headers=auth_header(token),
        )
    assert res.status_code == 201, res.text
    data = res.json()

    assert data["candidate_name"] == "RAHUL VERMA"
    assert data["email"] == "rahul.verma@example.com"
    assert "python" in data["skills"]
    assert "fastapi" in data["skills"]
    assert data["highest_education_level"] == "bachelor"
    assert data["total_experience_years"] >= 3.5
    assert any("Resume Parser API" in p["title"] for p in data["projects"])
    assert data["certifications"]

    # replacing the resume keeps exactly one row per user
    with open(resume_file, "rb") as fh:
        again = client.post(
            "/api/v1/resumes/upload",
            files={"file": ("rahul_verma_v2.docx", fh)},
            headers=auth_header(token),
        )
    assert again.status_code == 201
    mine = client.get("/api/v1/resumes/me", headers=auth_header(token))
    assert mine.status_code == 200
    assert mine.json()["original_filename"] == "rahul_verma_v2.docx"


def test_recommendations_ranked(client):
    token = login_token(client, CANDIDATE["email"], CANDIDATE["password"])
    res = client.get("/api/v1/resumes/me/recommendations", headers=auth_header(token))
    assert res.status_code == 200, res.text
    recs = res.json()
    assert len(recs) >= 1
    scores = [r["match_score"] for r in recs]
    assert scores == sorted(scores, reverse=True)
    top = recs[0]
    assert top["matched_skills"], "python-heavy resume should match the python job"
    assert set(top) >= {"job_id", "title", "match_score", "skill_score", "semantic_score", "missing_skills"}


def test_apply_flow_with_match_scores(client):
    cand_token = login_token(client, CANDIDATE["email"], CANDIDATE["password"])
    jobs = client.get("/api/v1/jobs", params={"search": "Python"}).json()
    job_id = next(j["id"] for j in jobs if j["title"] == "Python Backend Developer")

    res = client.post(
        "/api/v1/applications",
        json={"job_id": job_id, "cover_letter": "I love building APIs."},
        headers=auth_header(cand_token),
    )
    assert res.status_code == 201, res.text
    app_data = res.json()
    assert app_data["status"] == "applied"
    assert app_data["skill_score"] > 80  # all required skills present on resume
    assert "python" in [s.lower() for s in app_data["matched_skills"]]
    assert app_data["match_score"] > 50

    # duplicate application blocked
    dup = client.post("/api/v1/applications", json={"job_id": job_id}, headers=auth_header(cand_token))
    assert dup.status_code == 409

    # candidate sees own application
    mine = client.get("/api/v1/applications/me", headers=auth_header(cand_token))
    assert mine.status_code == 200
    assert any(a["job_id"] == job_id for a in mine.json())


def test_recruiter_screens_applicants(client):
    rec_token = login_token(client, RECRUITER["email"], RECRUITER["password"])
    jobs = client.get("/api/v1/jobs/mine", headers=auth_header(rec_token)).json()
    job_id = next(j["id"] for j in jobs if j["title"] == "Python Backend Developer")

    res = client.get(f"/api/v1/applications/job/{job_id}", headers=auth_header(rec_token))
    assert res.status_code == 200, res.text
    applicants = res.json()
    assert len(applicants) == 1
    summary = applicants[0]
    assert summary["candidate_email"] == CANDIDATE["email"]
    assert summary["application"]["match_score"] > 50
    assert "python" in summary["resume_skills"]

    application_id = summary["application"]["id"]
    patch = client.patch(
        f"/api/v1/applications/{application_id}",
        json={"status": "shortlisted", "notes": "Strong skills overlap"},
        headers=auth_header(rec_token),
    )
    assert patch.status_code == 200, patch.text
    assert patch.json()["status"] == "shortlisted"

    cand_view = login_token(client, CANDIDATE["email"], CANDIDATE["password"])
    mine = client.get("/api/v1/applications/me", headers=auth_header(cand_view)).json()
    status_map = {a["id"]: a["status"] for a in mine}
    assert status_map[application_id] == "shortlisted"


def test_auth_guards(client):
    # no token -> 401
    assert client.get("/api/v1/resumes/me").status_code == 401
    # garbage token -> 401
    assert (
        client.get("/api/v1/auth/me", headers=auth_header("not-a-jwt")).status_code == 401
    )
