"""ATS (Applicant Tracking System) Readiness Scorer.

Evaluates resume parseability, keyword density, section structure,
quantifiable metrics, and format compliance against real-world ATS standards.
"""

from __future__ import annotations

import re
from typing import Any

# Regex patterns for measurable achievements and metrics
_METRIC_PATTERNS = [
    re.compile(r"\b\d+(?:\.\d+)?\s*(?:%|percent)\b", re.IGNORECASE),
    re.compile(r"[\$€£₹]\s*\d+(?:,\d+)*(?:\.\d+)?(?:\s*(?:k|m|million|billion|lpa|cr|crore))?\b", re.IGNORECASE),
    re.compile(r"\b\d+(?:\.\d+)?\s*(?:x|times|fold)\b", re.IGNORECASE),
    re.compile(r"\b(?:increased|reduced|improved|decreased|accelerated|boosted|scaled|saved|cut|optimized)\s+[^.\n]{0,40}?\b\d+", re.IGNORECASE),
    re.compile(r"\b(?:team|group|squad|organization)\s+of\s+\d+\b", re.IGNORECASE),
    re.compile(r"\b\d+\s*\+\s*(?:users|clients|customers|downloads|requests|queries|rps|tps|prs|commits)\b", re.IGNORECASE),
]

_ACTION_VERBS = [
    "spearheaded", "architected", "engineered", "orchestrated", "developed",
    "implemented", "streamlined", "designed", "deployed", "scaled",
    "optimized", "automated", "mentored", "collaborated", "pioneered",
    "delivered", "resolved", "executed", "formulated", "established"
]


def compute_ats_score(raw_text: str, parsed_resume: dict[str, Any]) -> dict[str, Any]:
    """Compute an explainable, 100-point ATS compliance and readiness score."""
    text = (raw_text or "").strip()
    words = text.split()
    word_count = len(words)

    # -------------------------------------------------------------
    # 1. Contact Information Completeness (15 points max)
    # -------------------------------------------------------------
    contact_pts = 0
    missing_contact: list[str] = []

    if parsed_resume.get("email"):
        contact_pts += 4
    else:
        missing_contact.append("Email Address")

    if parsed_resume.get("phone"):
        contact_pts += 4
    else:
        missing_contact.append("Phone Number")

    if parsed_resume.get("candidate_name") and len(parsed_resume["candidate_name"].strip()) >= 2:
        contact_pts += 4
    else:
        missing_contact.append("Full Name")

    if parsed_resume.get("location"):
        contact_pts += 3
    else:
        missing_contact.append("City / Location")

    # -------------------------------------------------------------
    # 2. Section Structure & Standard Headings (20 points max)
    # -------------------------------------------------------------
    sections_pts = 0
    missing_sections: list[str] = []

    experience_list = parsed_resume.get("experience") or []
    if experience_list or re.search(r"\b(experience|work history|employment)\b", text, re.IGNORECASE):
        sections_pts += 6
    else:
        missing_sections.append("Work Experience")

    skills_list = parsed_resume.get("skills") or []
    if skills_list or re.search(r"\b(skills|technologies|proficiencies)\b", text, re.IGNORECASE):
        sections_pts += 6
    else:
        missing_sections.append("Skills")

    education_list = parsed_resume.get("education") or []
    if education_list or re.search(r"\b(education|academic|degree)\b", text, re.IGNORECASE):
        sections_pts += 4
    else:
        missing_sections.append("Education")

    if parsed_resume.get("summary") or re.search(r"\b(summary|objective|profile|about)\b", text, re.IGNORECASE):
        sections_pts += 2
    else:
        missing_sections.append("Professional Summary")

    projects_list = parsed_resume.get("projects") or []
    certs_list = parsed_resume.get("certifications") or []
    if projects_list or certs_list or re.search(r"\b(projects?|certifications?|licenses?)\b", text, re.IGNORECASE):
        sections_pts += 2
    else:
        missing_sections.append("Projects or Certifications")

    # -------------------------------------------------------------
    # 3. Skills & Competencies Breadth (25 points max)
    # -------------------------------------------------------------
    skills_count = len(skills_list)
    if skills_count >= 10:
        skills_pts = 25
    elif skills_count >= 7:
        skills_pts = 20
    elif skills_count >= 4:
        skills_pts = 15
    elif skills_count >= 1:
        skills_pts = 8
    else:
        skills_pts = 0

    # -------------------------------------------------------------
    # 4. Quantifiable Impact & Metrics (25 points max)
    # -------------------------------------------------------------
    metric_matches = 0
    for pat in _METRIC_PATTERNS:
        matches = pat.findall(text)
        metric_matches += len(matches)

    # Also detect strong action verbs
    lower_text = text.lower()
    action_verb_count = sum(1 for verb in _ACTION_VERBS if re.search(rf"\b{verb}\b", lower_text))

    if metric_matches >= 4:
        metrics_pts = 25
    elif metric_matches >= 3:
        metrics_pts = 20
    elif metric_matches >= 2:
        metrics_pts = 15
    elif metric_matches >= 1:
        metrics_pts = 10
    else:
        # Give partial credit if action verbs are present
        metrics_pts = min(8, action_verb_count * 2)

    # -------------------------------------------------------------
    # 5. Formatting & Length Readability (15 points max)
    # -------------------------------------------------------------
    formatting_pts = 0
    # Length appropriateness
    if 350 <= word_count <= 1200:
        formatting_pts += 10
    elif 200 <= word_count < 350:
        formatting_pts += 7
    elif 1200 < word_count <= 1800:
        formatting_pts += 7
    elif word_count > 1800:
        formatting_pts += 4
    else:
        formatting_pts += 2

    # Bullet / structure density check
    bullet_matches = len(re.findall(r"(?:^[•\-\*]|\n[•\-\*]|\b\d+\.\s)", text))
    if bullet_matches >= 5:
        formatting_pts += 5
    elif bullet_matches >= 2:
        formatting_pts += 3
    else:
        formatting_pts += 1

    # -------------------------------------------------------------
    # Total Score Calculation
    # -------------------------------------------------------------
    total_raw = contact_pts + sections_pts + skills_pts + metrics_pts + formatting_pts
    final_score = max(5.0, min(99.0, float(total_raw)))

    # Normalized percentages for visual breakdown
    breakdown = {
        "contact_pct": round((contact_pts / 15) * 100),
        "sections_pct": round((sections_pts / 20) * 100),
        "skills_pct": round((skills_pts / 25) * 100),
        "metrics_pct": round((metrics_pts / 25) * 100),
        "formatting_pct": round((formatting_pts / 15) * 100),
        "contact_pts": contact_pts,
        "sections_pts": sections_pts,
        "skills_pts": skills_pts,
        "metrics_pts": metrics_pts,
        "formatting_pts": formatting_pts,
    }

    # -------------------------------------------------------------
    # Actionable Optimization Tips
    # -------------------------------------------------------------
    tips: list[str] = []
    if missing_contact:
        tips.append(f"Header missing clearly parseable {', '.join(missing_contact)}. Place contact details at the very top.")

    if "Work Experience" in missing_sections:
        tips.append("Add a dedicated 'Work Experience' or 'Professional Experience' section header.")
    if "Skills" in missing_sections:
        tips.append("Add a standard 'Technical Skills' section heading to help ATS categorizers.")
    if "Professional Summary" in missing_sections:
        tips.append("Include a 2-3 sentence 'Professional Summary' at the top highlighting your primary role and core stack.")

    if skills_count < 8:
        tips.append(f"Only {skills_count} skills detected. Target 8 to 15 relevant technical keywords to maximize ATS keyword filters.")

    if metric_matches < 3:
        tips.append("Add quantifiable metrics (e.g., '% improved', '$ revenue impact', 'team size', 'latency reduction') to your experience bullets.")

    if action_verb_count < 3:
        tips.append("Start accomplishment bullets with active power verbs (e.g., 'Spearheaded', 'Architected', 'Streamlined', 'Engineered').")

    if word_count < 300:
        tips.append("Resume is on the shorter side (< 300 words). Add more detail to your accomplishments and project descriptions.")
    elif word_count > 1500:
        tips.append("Resume is lengthy (> 1,500 words). Condense older positions to maintain recruiter and ATS attention.")

    if not tips:
        tips.append("Resume follows best-in-class ATS formatting standards.")
        tips.append("Strong keyword density and quantifiable accomplishment metrics detected.")

    return {
        "ats_score": round(final_score, 1),
        "breakdown": breakdown,
        "metrics_count": metric_matches,
        "word_count": word_count,
        "skills_count": skills_count,
        "missing_sections": missing_sections,
        "actionable_tips": tips[:5],  # top actionable recommendations
    }
