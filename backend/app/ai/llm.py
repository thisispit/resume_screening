"""LLM-powered resume parsing & job matching over an OpenAI-compatible API.

Supported providers (all expose the /chat/completions schema):
  - groq        https://api.groq.com/openai/v1
  - openrouter  https://openrouter.ai/api/v1
  - openai      https://api.openai.com/v1
  - gemini      https://generativelanguage.googleapis.com/v1beta/openai/

Configure via `.env`:
    LLM_PROVIDER=groq
    LLM_API_KEY=<your key>
    LLM_MODEL=        # optional override
    LLM_BASE_URL=     # optional override

When LLM_API_KEY is empty, `is_llm_available()` returns False and callers
transparently fall back to the heuristic parser / local embeddings, so the
app keeps working fully offline.
"""

from __future__ import annotations

import json
import re

import httpx

from app.core.config import settings

_PROVIDER_DEFAULTS: dict[str, dict[str, str]] = {
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "model": "meta-llama/llama-3.3-70b-instruct",
    },
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4o-mini",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model": "gemini-1.5-flash",
    },
}

_PARSE_SYSTEM_PROMPT = (
    "You are a precise resume parser. Read the resume text and return ONLY a "
    "JSON object (no markdown, no commentary) with exactly these keys:\n"
    "{\n"
    '  "candidate_name": string|null, "email": string|null, "phone": string|null, "location": string|null,\n'
    '  "summary": string|null,\n'
    '  "skills": string[],\n'
    '  "education": [{"degree": string, "institution": string|null, "year": string|null, '
    '"field_of_study": string|null, "level": "phd"|"master"|"bachelor"|"diploma"}],\n'
    '  "experience": [{"title": string|null, "company": string|null, "start_date": string|null, '
    '"end_date": string|null, "duration_years": number|null, "details": string[]}],\n'
    '  "projects": [{"title": string, "description": string}],\n'
    '  "certifications": string[],\n'
    '  "total_experience_years": number,\n'
    '  "highest_education_level": "phd"|"master"|"bachelor"|"diploma"|"none"\n'
    "}\n"
    "Rules:\n"
    "- highest_education_level must reflect the highest level found.\n"
    "- total_experience_years must be a decimal number (0.0 if none).\n"
    "- Skip any field that is not present (use null / empty list).\n"
    "- Keep skill names short and lowercase (e.g. 'python', 'fastapi', 'ml').\n"
    "- Dates as written in the resume (e.g. 'May 2021', 'Present').\n"
)

_MATCH_SYSTEM_PROMPT = (
    "You are a strict resume-job matcher. Given a candidate resume and a job "
    "description, return ONLY a single number from 0 to 100 representing the "
    "candidate's overall fit (skills, experience, education, domain). "
    "Do not output anything else, just the number."
)


def is_llm_available() -> bool:
    """True when an LLM API key is configured; otherwise run offline."""
    return bool((settings.LLM_API_KEY or "").strip())


def _endpoint() -> str:
    provider = (settings.LLM_PROVIDER or "groq").lower()
    defaults = _PROVIDER_DEFAULTS.get(provider, {})
    base = (settings.LLM_BASE_URL or defaults.get("base_url") or "").rstrip("/")
    return f"{base}/chat/completions"


def _model() -> str:
    if settings.LLM_MODEL:
        return settings.LLM_MODEL
    provider = (settings.LLM_PROVIDER or "groq").lower()
    return _PROVIDER_DEFAULTS.get(provider, {}).get("model", "gpt-4o-mini")


def _chat_json(messages: list[dict], *, max_tokens: int = 1600) -> str:
    resp = httpx.post(
        _endpoint(),
        headers={
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": _model(),
            "messages": messages,
            "temperature": 0.0,
            "max_tokens": max_tokens,
        },
        timeout=settings.LLM_TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _parse_json_response(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.S)
        if match:
            return json.loads(match.group(0))
        raise ValueError("LLM returned invalid JSON")


def _repair_parsed(data: dict) -> dict:
    def _as_list(value, default=None) -> list:
        if value is None:
            return default if default is not None else []
        if isinstance(value, list):
            return value
        return [value]

    def _as_strs(items: list) -> list[str]:
        return [str(i).strip() for i in items if str(i).strip()]

    education = []
    for item in _as_list(data.get("education")):
        if isinstance(item, dict) and str(item.get("degree", "")).strip():
            education.append(
                {
                    "degree": str(item["degree"]),
                    "institution": item.get("institution") or None,
                    "year": item.get("year") or None,
                    "field_of_study": item.get("field_of_study") or None,
                    "level": item.get("level") or None,
                }
            )

    experience = []
    for item in _as_list(data.get("experience")):
        if isinstance(item, dict) and (item.get("title") or item.get("company")):
            experience.append(
                {
                    "title": item.get("title") or None,
                    "company": item.get("company") or None,
                    "start_date": item.get("start_date") or None,
                    "end_date": item.get("end_date") or None,
                    "duration_years": _to_float(item.get("duration_years")),
                    "details": _as_strs(_as_list(item.get("details")))[:12],
                }
            )

    projects = []
    for item in _as_list(data.get("projects")):
        if isinstance(item, dict) and str(item.get("title", "")).strip():
            projects.append(
                {"title": str(item["title"]), "description": item.get("description") or ""}
            )

    try:
        total_years = _to_float(data.get("total_experience_years"))
    except (TypeError, ValueError):
        total_years = _sum_llm_durations(experience)

    return {
        "candidate_name": (data.get("candidate_name") or None),
        "email": (data.get("email") or None),
        "phone": (data.get("phone") or None),
        "location": (data.get("location") or None),
        "summary": (data.get("summary") or None),
        "skills": _as_strs(_as_list(data.get("skills"))),
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": _as_strs(_as_list(data.get("certifications"))),
        "total_experience_years": total_years,
        "highest_education_level": (data.get("highest_education_level") or "none"),
    }


def _to_float(value) -> float:
    if value is None or value == "":
        return 0.0
    if isinstance(value, str):
        match = re.search(r"\d+(?:\.\d+)?", value)
        if not match:
            return 0.0
        return round(float(match.group(0)), 1)
    return round(float(value), 1)


def _sum_llm_durations(experience: list) -> float:
    total = 0.0
    for entry in experience:
        dur = _to_float(entry.get("duration_years"))
        if dur > 0:
            total += dur
    return round(total, 1)


def extract_resume_with_llm(raw_text: str) -> dict:
    """Parse a raw resume into structured fields using the LLM."""
    content = _chat_json(
        [
            {"role": "system", "content": _PARSE_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Resume text to parse:\n\n{raw_text[:12000]}",
            },
        ]
    )
    return _repair_parsed(_parse_json_response(content))


def match_resume_to_job(resume_text: str, job_text: str) -> float:
    """Ask the LLM for a 0-100 fit score between a resume and a job."""
    content = _chat_json(
        [
            {"role": "system", "content": _MATCH_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"RESUME:\n{resume_text[:6000]}\n\n"
                    f"JOB DESCRIPTION:\n{job_text[:4000]}"
                ),
            },
        ],
        max_tokens=20,
    )
    match = re.search(r"\d{1,3}(?:\.\d+)?", content)
    if not match:
        raise ValueError(f"LLM matcher returned no number: {content!r}")
    return max(0.0, min(100.0, float(match.group(0))))