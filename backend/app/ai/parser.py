"""Resume file parsing: PDF/DOCX text extraction + structured information parsing."""

from __future__ import annotations

import re
from datetime import datetime

PARSER_VERSION = "1.0"

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(
    r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}"
)

_EDUCATION_PATTERNS: list[tuple[str, str]] = [
    (r"ph\.?d|doctorate", "phd"),
    (r"m\.?tech|m\.?e\b(?!c)|master of (?:technology|engineering|science|business)|m\.?sc|m\.?b\.?a|m\.?com|m\.?a\b", "master"),
    (r"b\.?tech|bachelor of (?:technology|engineering|science|business|arts|computer)|b\.?e\b(?!n)|b\.?sc|b\.?com|b\.?b\.?a|b\.?c\.?a", "bachelor"),
    (r"diploma", "diploma"),
]
_EDUCATION_LEVEL_RANK = {"none": 0, "diploma": 1, "bachelor": 2, "master": 3, "phd": 4}

_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}
_DATE_RANGE_RE = re.compile(
    r"([A-Za-z]{3,9})?\s*(\d{4})\s*[-–—to]+\s*([A-Za-z]{3,9})?\s*(\d{4}|present|current|till date|now)",
    re.IGNORECASE,
)
_YEARS_CLAIM_RE = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*years?", re.IGNORECASE)

_SECTION_HEADINGS = {
    "experience": r"work experience|professional experience|experience|employment history",
    "education": r"education( & qualifications)?|academic (background|qualifications)",
    "projects": r"projects?|academic projects?",
    "certifications": r"certifications?|licenses?|courses? & certifications?",
    "skills": r"(technical )?skills|technical proficienc(?:y|ies)|technologies",
    "summary": r"summary|profile|objective|about me",
}


# ---------- Text extraction ----------

def extract_text_pdf(path: str) -> str:
    import fitz  # PyMuPDF

    parts: list[str] = []
    with fitz.open(path) as doc:
        for page in doc:
            parts.append(page.get_text("text"))
    return "\n".join(parts)


def extract_text_docx(path: str) -> str:
    from docx import Document

    doc = Document(path)
    parts = [p.text for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                t = cell.text.strip()
                if t:
                    parts.append(t)
    return "\n".join(parts)


def extract_text(path: str, file_type: str) -> str:
    if file_type == "pdf":
        return extract_text_pdf(path)
    if file_type == "docx":
        return extract_text_docx(path)
    raise ValueError(f"Unsupported file type: {file_type}")


# ---------- Structured parsing ----------

def _clean_line(line: str) -> str:
    return line.strip().strip("|•·-–—").strip()


def _guess_name(text: str) -> str | None:
    for raw in text.splitlines()[:15]:
        line = _clean_line(raw)
        if not line or len(line) > 60 or "@" in line or any(c.isdigit() for c in line):
            continue
        words = line.split()
        if 1 < len(words) <= 5 and all(w[0].isupper() or w.islower() is False for w in words):
            if sum(w[0].isupper() for w in words) >= max(1, len(words) - 1):
                return line
    # fallback: spaCy PERSON entity
    try:
        import spacy

        nlp = _get_spacy()
        doc = nlp(text[:1000])
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                return ent.text.strip()
    except Exception:
        pass
    return None


_SPACY_NLP = None


def _get_spacy():
    global _SPACY_NLP
    if _SPACY_NLP is None:
        import spacy

        try:
            _SPACY_NLP = spacy.load("en_core_web_sm")
        except Exception:
            _SPACY_NLP = spacy.blank("en")
    return _SPACY_NLP


def _parse_education(text: str) -> tuple[list[dict], str]:
    entries: list[dict] = []
    highest = "none"
    edu_section = _extract_section(text, "education") or text
    for pattern, level in _EDUCATION_PATTERNS:
        for m in re.finditer(pattern, edu_section, re.IGNORECASE):
            degree = m.group(0).strip()
            snippet = edu_section[max(0, m.start() - 40): m.end() + 120]
            inst_m = re.search(
                r"(?:college|university|institute|school|iit|nit|iiit)\b[^,\n]*",
                snippet,
                re.IGNORECASE,
            )
            year_m = re.search(r"\b(19|20)\d{2}\b", snippet)
            entry = {
                "degree": degree.upper(),
                "institution": inst_m.group(0).strip() if inst_m else None,
                "year": year_m.group(0) if year_m else None,
            }
            if entry not in entries:
                entries.append(entry)
            if _EDUCATION_LEVEL_RANK[level] > _EDUCATION_LEVEL_RANK[highest]:
                highest = level
    return entries, highest


def _months_between(start: tuple[int, int], end: tuple[int, int]) -> float:
    return max(0.0, (end[0] - start[0]) * 12 + (end[1] - start[1]))


def _sum_date_ranges(text: str) -> float:
    """Sum all date-range spans found in *text* (months), skipping bad ranges."""
    total = 0.0
    now = datetime.now()
    for m in _DATE_RANGE_RE.finditer(text):
        sm, sy, em, ey = m.groups()
        try:
            start_year = int(sy)
        except (TypeError, ValueError):
            continue
        start_month = _MONTHS.get((sm or "jan")[:3].lower(), 1)
        if ey and ey.lower() in ("present", "current", "now"):
            end_year, end_month = now.year, now.month
        else:
            try:
                end_year = int(ey)
            except (TypeError, ValueError):
                continue
            end_month = _MONTHS.get((em or "dec")[:3].lower(), 12)
        if start_year < 1980 or end_year > now.year + 1 or end_year < start_year:
            continue
        total += _months_between((start_year, start_month), (end_year, end_month))
    return total


def _parse_experience_years(text: str) -> float:
    # 1) Most reliable signal: an explicit "X years" claim anywhere.
    claim = _YEARS_CLAIM_RE.search(text)
    claim_years = float(claim.group(1)) if claim else 0.0

    # 2) Otherwise sum the date ranges that appear *inside the work-experience
    #    section* only, so education/project dates are not counted as experience.
    exp_section = _extract_section(text, "experience")
    if exp_section:
        months = _sum_date_ranges(exp_section)
        if months > 0:
            range_years = round(months / 12, 1)
        else:
            range_years = claim_years
    else:
        range_years = claim_years

    # 3) If we only have a claimed figure, trust it; otherwise use the larger
    #    of the two signals but cap it so one stray date cannot explode it.
    if claim_years > 0 and range_years > 0:
        # Prefer the range (more granular) but never exceed ~1.5x the claim,
        # in case a duplicated/unrelated range inflated it.
        years = min(range_years, claim_years * 1.5)
    else:
        years = max(range_years, claim_years)
    return round(min(years, 45.0), 1)


def _extract_section(text: str, section: str) -> str | None:
    head = _SECTION_HEADINGS[section]
    keys = sorted(_SECTION_HEADINGS.values())
    pattern = re.compile(
        rf"^(?:{head})\s*:?\s*$", re.IGNORECASE | re.MULTILINE
    )
    matches = list(pattern.finditer(text))
    if not matches:
        pattern_inline = re.compile(rf"^({head})\s*:\s*", re.IGNORECASE | re.MULTILINE)
        matches = list(pattern_inline.finditer(text))
        if not matches:
            return None
    start = matches[-1].end()
    next_heads = "|".join(k for k in keys if k != head)
    rest = text[start:]
    nxt = re.search(rf"^(?:{next_heads})\s*:?\s*$", rest, re.IGNORECASE | re.MULTILINE)
    body = rest[: nxt.start()] if nxt else rest
    return body.strip()


def parse_resume(raw_text: str) -> dict:
    """Parse resume *raw_text* into structured fields."""
    text = raw_text.replace("\r\n", "\n")
    email_m = _EMAIL_RE.search(text)
    phone_m = _PHONE_RE.search(text.replace("\u00a0", " "))
    phone = phone_m.group(0).strip() if phone_m else None
    if phone and sum(c.isdigit() for c in phone) < 10:
        phone = None
        for m in _PHONE_RE.finditer(text):
            if sum(c.isdigit() for c in m.group(0)) >= 10:
                phone = m.group(0).strip()
                break

    skills_section = _extract_section(text, "skills")

    from app.ai.skills import extract_skills

    skills = extract_skills(skills_section if skills_section else text)

    summary_section = _extract_section(text, "summary")
    location_m = re.search(
        r"(?:location|address)\s*[:\-]\s*([A-Za-z .,'-]{3,80})", text, re.IGNORECASE
    )

    education_entries, highest_edu = _parse_education(text)
    exp_years = _parse_experience_years(text)

    projects_body = _extract_section(text, "projects")
    projects = []
    if projects_body:
        bullets = [
            _clean_line(b)
            for b in re.split(r"\n(?=[•\-*]|\d+\.|\s{4,})", projects_body)
            if len(_clean_line(b)) > 15
        ]
        projects = [{"title": b.split(":")[0][:120], "description": b[:500]} for b in bullets[:10]]

    certs_body = _extract_section(text, "certifications")
    certifications = []
    if certs_body:
        for b in re.split(r"\n|;", certs_body):
            clean = _clean_line(b)
            if 5 < len(clean) < 200 and not re.match(r"^(page|curriculum)", clean, re.IGNORECASE):
                certifications.append(clean[:200])
        certifications = certifications[:15]

    experience_body = _extract_section(text, "experience")
    experience = []
    if experience_body:
        for chunk in re.split(r"\n(?=[•\-*]|\d+\.)", experience_body)[:10]:
            clean = _clean_line(chunk)
            if len(clean) > 15:
                experience.append({"detail": clean[:500]})

    return {
        "candidate_name": _guess_name(text),
        "email": email_m.group(0) if email_m else None,
        "phone": phone,
        "location": location_m.group(1).strip() if location_m else None,
        "summary": (summary_section[:600] if summary_section else None),
        "skills": skills,
        "education": education_entries,
        "experience": experience,
        "projects": projects,
        "certifications": certifications,
        "total_experience_years": exp_years,
        "highest_education_level": highest_edu,
    }
