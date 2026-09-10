"""Explainable match scoring engine.

Total score = skills (45%) + semantic similarity (30%) + experience (15%) + education (10%).
All sub-scores are in [0, 100]; the total is a weighted average.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.ai import embedder
from app.ai.skills import match_skills
from app.core.config import settings
from app.core.enums import EducationLevel

_EDU_RANK = {
    EducationLevel.NONE.value: 0,
    EducationLevel.DIPLOMA.value: 1,
    EducationLevel.BACHELOR.value: 2,
    EducationLevel.MASTER.value: 3,
    EducationLevel.PHD.value: 4,
}
# Partial credit when the candidate is one level below the requirement.
_ONE_LEVEL_BELOW_CREDIT = 0.5


@dataclass
class MatchResult:
    total_score: float = 0.0
    skill_score: float = 0.0
    semantic_score: float = 0.0
    experience_score: float = 0.0
    education_score: float = 0.0
    matched_skills: list[str] = field(default_factory=list)
    missing_skills: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "match_score": round(self.total_score, 2),
            "skill_score": round(self.skill_score, 2),
            "semantic_score": round(self.semantic_score, 2),
            "experience_score": round(self.experience_score, 2),
            "education_score": round(self.education_score, 2),
            "matched_skills": self.matched_skills,
            "missing_skills": self.missing_skills,
        }


def _resume_text_for_semantic(resume_text: str, resume_skills: list[str], resume_context: str | None = None) -> str:
    if resume_context:
        return resume_context
    parts = [resume_text[:1500], ", ".join(resume_skills)]
    return " ".join(p for p in parts if p)


def _semantic_score(resume_text: str, job_text: str) -> float:
    """Semantic fit in [0,100]: LLM when available, else local embeddings."""
    from app.ai import llm

    if settings.USE_LLM_MATCHING and llm.is_llm_available():
        try:
            return llm.match_resume_to_job(resume_text[:6000], job_text[:4000])
        except Exception as exc:
            print(f"[matcher] LLM matching failed ({exc}); using local embeddings")
    sim = embedder.semantic_similarity(resume_text[:1500], job_text[:1500])
    return sim * 100


def compute_match(
    *,
    raw_text: str,
    candidate_skills: list[str],
    total_experience_years: float,
    highest_education_level: str,
    job_description: str,
    required_skills: list[str],
    min_experience_years: float,
    education_level: str,
    resume_context: str | None = None,
) -> MatchResult:
    """Score one candidate resume against one job posting."""
    result = MatchResult()

    # 1) Skills overlap (alias-aware)
    matched, missing = match_skills(candidate_skills, required_skills)
    result.matched_skills = matched
    result.missing_skills = missing
    result.skill_score = (len(matched) / len(required_skills)) * 100 if required_skills else 100.0

    # 2) Semantic similarity between resume content and the job description + skills
    job_text = f"{job_description}\nRequired skills: {', '.join(required_skills)}"
    result.semantic_score = _semantic_score(
        _resume_text_for_semantic(raw_text or "", candidate_skills, resume_context),
        job_text,
    )

    # 3) Experience — capped ratio, full credit once the bar is met
    if min_experience_years <= 0:
        result.experience_score = 100.0
    else:
        result.experience_score = (
            min(total_experience_years / min_experience_years, 1.0) * 100
        )

    # 4) Education — rank comparison with partial credit for one level below
    cand_rank = _EDU_RANK.get(highest_education_level, 0)
    req_rank = _EDU_RANK.get(education_level, 2)
    if cand_rank >= req_rank:
        result.education_score = 100.0
    elif cand_rank == req_rank - 1:
        result.education_score = _ONE_LEVEL_BELOW_CREDIT * 100
    else:
        result.education_score = max(0.0, cand_rank / max(req_rank, 1)) * 50

    s = settings
    result.total_score = (
        result.skill_score * s.WEIGHT_SKILLS
        + result.semantic_score * s.WEIGHT_SEMANTIC
        + result.experience_score * s.WEIGHT_EXPERIENCE
        + result.education_score * s.WEIGHT_EDUCATION
    )
    return result
