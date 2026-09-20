"""AI layer: resume parsing, skill extraction, semantic similarity and match scoring."""

from app.ai.ats_scorer import compute_ats_score
from app.ai.matcher import MatchResult, compute_match
from app.ai.parser import PARSER_VERSION, extract_text, parse_resume
from app.ai.skills import extract_skills, match_skills

__all__ = [
    "compute_ats_score",
    "MatchResult",
    "compute_match",
    "PARSER_VERSION",
    "extract_text",
    "parse_resume",
    "extract_skills",
    "match_skills",
]
