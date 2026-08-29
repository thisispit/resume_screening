"""AI layer: resume parsing, skill extraction, semantic similarity and match scoring."""

from app.ai.matcher import MatchResult, compute_match
from app.ai.parser import PARSER_VERSION, extract_text, parse_resume
from app.ai.skills import extract_skills, match_skills

__all__ = [
    "MatchResult",
    "compute_match",
    "PARSER_VERSION",
    "extract_text",
    "parse_resume",
    "extract_skills",
    "match_skills",
]
