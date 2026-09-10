"""Resume file parsing: PDF/DOCX text extraction + structured information parsing.

`parse_resume()` is LLM-first: when an LLM API key is configured (see
:mod:`app.ai.llm`) it uses the LLM for accurate extraction; otherwise it
falls back to the local heuristic parser. The app therefore works fully
offline, and gets much better accuracy the moment a key is added.
"""

from __future__ import annotations

import re
from datetime import datetime

PARSER_VERSION = "2.1"

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(
    r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}"
)

_EDUCATION_PATTERNS: list[tuple[str, str]] = [
    (r"\bph\.?\s?d\b|doctor of philosophy", "phd"),
    (
        r"\bm(?:\.\s?)?tech\b|master of (?:technology|engineering|science|business|arts|computer|administration)|"
        r"\bm\.?c\.?a\b|\bm(?:\.\s?)?s\b|\bm\.?sc\b|\bm\.?com\b|\bm\.?b\.?a\b|\bm\.?a\b|\bm\.?e\b",
        "master",
    ),
    (
        r"\bb(?:\.\s?)?tech\b|bachelor of (?:technology|engineering|science|business|arts|computer|administration)|"
        r"\bb\.?c\.?a\b|\bb\.?e\b|\bb(?:\.\s?)?s\b|\bb\.?sc\b|\bb\.?com\b|\bb\.?b\.?a\b|\bb\.?a\b",
        "bachelor",
    ),
    (r"\b(?:diploma|pg ?diploma)\b", "diploma"),
]
_EDUCATION_LEVEL_RANK = {"none": 0, "diploma": 1, "bachelor": 2, "master": 3, "phd": 4}

_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}
_MONTHS_REV = {1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
               7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"}

_MONTHS_PAT = (
    r"january|february|march|april|may|june|july|august|september|october|november|december|"
    r"jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec"
)
_YEAR = r"(?:19|20)\d{2}"
_DATE_RANGE_RE = re.compile(
    rf"(?P<sm>(?:{_MONTHS_PAT}))\s*(?P<sy>{_YEAR})?\s*[-–—/→]+\s*"
    rf"(?:(?P<em>(?:{_MONTHS_PAT}))\s+)?(?P<ey>{_YEAR}|present|current|now|till\s*date|till now)",
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

# Role-title hints used to split experience section into jobs.
_ROLE_SENIORITY = r"(?:senior|lead|junior|sr\.?|jr\.?|principal|staff|chief|associate|assistant|principal|chartered)?"
_ROLE_KW = (
    r"engineer|developer|scientist|analyst|manager|director|head|architect|consultant|designer|"
    r"intern|specialist|administrator|coordinator|executive|officer|researcher|recruiter|trainer|"
    r"supervisor|tester|programmer|trainee|founder|co-?founder|sde|freelancer|software|developer|"
    r"data (?:scientist|engineer|analyst)|machine learning|devops|full ?stack|backend|frontend"
)
_ROLE_AT_RE = re.compile(
    rf"^(?P<title>.+?)\s+(?:at|@)\s+(?P<company>[A-Za-z0-9&.,'\- ]+)$",
    re.IGNORECASE,
)
_ROLE_HEAD_RE = re.compile(
    rf"^(?:{_ROLE_SENIORITY})\s*(?:{_ROLE_KW})", re.IGNORECASE
)
_CITY_WORDS = re.compile(
    r"\b(bengaluru|bangalore|hyderabad|delhi|noida|gurgaon|gurugram|pune|mumbai|chennai|"
    r"kolkata|india|remote|hybrid|onsite|work from home)\b",
    re.IGNORECASE,
)
_FIELD_RE = re.compile(
    r"(?:\bin\s+|[,|]\s*)([A-Za-z0-9 &.'\/\-+]{2,40}?)(?=[,.]|\s+(?:from|at|university|college|institute|\)|$))",
    re.IGNORECASE,
)


def _extract_institution(snippet: str) -> str | None:
    """Institution name near an education mention (after 'from'/'at', else keyword phrase)."""
    m = re.search(
        r"(?:from|at)\s+([A-Z][A-Za-z0-9&.'\- ]*(?:University|Institute|College|School|Academy|IIT|NIT|IIIT)[A-Za-z0-9&.'\- ]*)",
        snippet,
        re.IGNORECASE,
    )
    if not m:
        m = re.search(
            r"([A-Z][A-Za-z0-9&.'\- ]{0,10}?(?:University|Institute|College|School|Academy|IIT|NIT|IIIT)[A-Za-z0-9&.'\- ]*)",
            snippet,
        )
    if not m:
        return None
    cleaned = re.sub(r"[\s,;]+$", "", m.group(1)).strip()
    return cleaned or None


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


def _date_tuple(month: str | None, year: str | None, *, end: bool = False) -> tuple[int, int] | None:
    if not year:
        return None
    if year.lower() in ("present", "current", "now", "till date", "till now"):
        now = datetime.now()
        return (now.year, now.month)
    try:
        y = int(year)
    except (TypeError, ValueError):
        return None
    m = 12 if end else 1
    if month:
        m = _MONTHS.get(re.sub(r"\.$", "", month.lower())[:3], m)
    return (y, m)


def _months_between(start: tuple[int, int], end: tuple[int, int]) -> float:
    return max(0.0, (end[0] - start[0]) * 12 + (end[1] - start[1]))


def _sum_date_ranges(text: str) -> float:
    """Sum all date-range spans found in *text* (months), skipping bad ranges."""
    total = 0.0
    now = datetime.now()
    for m in _DATE_RANGE_RE.finditer(text):
        start = _date_tuple(m.group("sm"), m.group("sy"))
        end = _date_tuple(m.group("em"), m.group("ey"), end=True)
        if start is None or end is None:
            continue
        sy, _sm = start
        ey, _em = end
        if sy < 1980 or ey > now.year + 1 or ey < sy:
            continue
        total += _months_between(start, end)
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
        years = min(range_years, claim_years * 1.5)
    else:
        years = max(range_years, claim_years)
    return round(min(years, 45.0), 1)


def _extract_section(text: str, section: str) -> str | None:
    head = _SECTION_HEADINGS[section]
    keys = sorted(_SECTION_HEADINGS.values())
    pattern = re.compile(rf"^(?:{head})\s*:?\s*$", re.IGNORECASE | re.MULTILINE)
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


# ---------- Experience ----------

def _is_bullet(raw: str) -> bool:
    s = raw.strip()
    return bool(re.match(r"^[•·‣▪◦\-*]", s) or re.match(r"^\d+[.)]", s))


def _split_role(line: str) -> tuple[str | None, str | None]:
    """Split a header line into (title, company); both optional."""
    parts = [p.strip() for p in re.split(r"[|¦·]", line) if p.strip()]
    if len(parts) == 1:
        m = _ROLE_AT_RE.match(line)
        if m:
            return m.group("title").strip(), m.group("company").strip()
        if "," in line and _ROLE_HEAD_RE.match(line):
            title, _, company = line.partition(",")
            return title.strip(), company.strip()
        return line, None

    non_dates = [
        p for p in parts
        if not _DATE_RANGE_RE.search(p) and not _CITY_WORDS.search(p)
    ]
    if not non_dates:
        return parts[0], None
    if len(non_dates) >= 2:
        if _ROLE_HEAD_RE.match(non_dates[0]):
            return non_dates[0], non_dates[1]
        if len(parts) >= 3:
            return non_dates[1], non_dates[0]
        return non_dates[0], non_dates[1]
    if _ROLE_HEAD_RE.match(non_dates[0]):
        return non_dates[0], None
    return None, non_dates[0]


def _fmt_date(dm: re.Match, *, end: bool) -> str | None:
    part = "em" if end else "sm"
    year = dm.group("sy") if not end else dm.group("ey")
    if not year:
        return None
    if end and dm.group("ey") and dm.group("ey").lower() in ("present", "current", "now"):
        return "Present"
    month = dm.group(part)
    if not month:
        return str(year)
    mon = re.sub(r"\.$", "", month.lower())[:3]
    return f"{_MONTHS_REV.get(_MONTHS.get(mon, 1))} {year}"


def _looks_like_role_header(line: str, index: int, lines: list[str]) -> bool:
    if _ROLE_AT_RE.match(line):
        return True
    if "|" in line:
        return True
    for nxt in lines[index + 1: index + 3]:
        if not nxt:
            continue
        if _DATE_RANGE_RE.search(_clean_line(nxt)):
            return len(line) <= 110
    return len(line) <= 60 and bool(_ROLE_HEAD_RE.match(line))


def _parse_experience(text: str) -> list[dict]:
    section = _extract_section(text, "experience")
    if not section:
        return []

    blocks: list[dict] = []
    cur: dict | None = None
    lines = [_clean_line(l) for l in section.splitlines()]

    for i, raw in enumerate(lines):
        line = _clean_line(raw)
        if not line:
            continue

        dm = _DATE_RANGE_RE.search(line)

        if _is_bullet(raw):
            if cur is not None and cur["dates"] is not None:
                cur["details"].append(line[:300])
            continue

        if dm:
            if cur is None or cur["dates"] is not None:
                title, company = _split_role(line)
                cur = {"title": title, "company": company, "dates": dm, "details": []}
                blocks.append(cur)
            else:
                cur["dates"] = dm
                if cur["company"] is None:
                    _t, company = _split_role(line)
                    cur["company"] = company
            continue

        # non-bullet, non-date line
        if _looks_like_role_header(line, i, lines):
            if cur is not None:
                blocks.append(cur)
            title, company = _split_role(line)
            cur = {"title": title, "company": company, "dates": None, "details": []}
            continue

        if cur is not None and cur["dates"] is not None:
            cur["details"].append(line[:300])

    if cur is not None:
        blocks.append(cur)

    return [_finalize_block(b) for b in blocks if b["title"] or b["company"] or b["details"]][:8]


def _finalize_block(block: dict) -> dict:
    dm = block["dates"]
    start = end = None
    duration_years = None
    if dm:
        st = _date_tuple(dm.group("sm"), dm.group("sy"))
        en = _date_tuple(dm.group("em"), dm.group("ey"), end=True)
        if st and en:
            duration_years = round(_months_between(st, en) / 12, 1)
        start = _fmt_date(dm, end=False)
        end = _fmt_date(dm, end=True)
    return {
        "title": (block["title"] or None),
        "company": (block["company"] or None),
        "start_date": start,
        "end_date": end,
        "duration_years": duration_years,
        "details": block["details"][:12],
    }


# ---------- Education ----------

def _parse_education(text: str) -> tuple[list[dict], str]:
    entries: list[dict] = []
    highest = "none"
    edu_section = _extract_section(text, "education") or text
    seen: set[tuple[str, str]] = set()

    for pattern, level in _EDUCATION_PATTERNS:
        for m in re.finditer(pattern, edu_section, re.IGNORECASE):
            degree = m.group(0).strip().rstrip(",").strip()
            snippet = edu_section[max(0, m.start() - 40): m.end() + 160]

            inst_m = _extract_institution(snippet)
            institution = inst_m if inst_m else None

            local = snippet[m.end(): m.end() + 50]
            field_m = _FIELD_RE.search(local)
            field = field_m.group(1).strip() if field_m else None
            if field and len(field) < 3:
                field = None

            year_m = re.search(r"\b(19|20)\d{2}\b", snippet)
            entry = {
                "degree": degree.upper(),
                "institution": institution,
                "year": year_m.group(0) if year_m else None,
                "field_of_study": field,
                "level": level,
            }
            key = (degree.lower(), institution or "")
            if key in seen:
                continue
            seen.add(key)
            entries.append(entry)
            if _EDUCATION_LEVEL_RANK[level] > _EDUCATION_LEVEL_RANK[highest]:
                highest = level
    return entries, highest


# ---------- Summary ----------

def _extract_summary(text: str) -> str | None:
    section = _extract_section(text, "summary")
    if section:
        cleaned = re.sub(r"\s+", " ", section).strip()
        return cleaned[:800] if cleaned else None
    for line in text.splitlines():
        line = _clean_line(line)
        if 50 < len(line) < 500 and "@" not in line:
            if not re.match(r"^(?:{})".format("|".join(_SECTION_HEADINGS.values())), line, re.IGNORECASE):
                return re.sub(r"\s+", " ", line).strip()[:800]
    return None


# ---------- Entry point ----------

def parse_resume(raw_text: str) -> dict:
    """Parse resume *raw_text* into structured fields (LLM-first, heuristic fallback)."""
    text = raw_text.replace("\r\n", "\n")

    from app.ai.llm import extract_resume_with_llm, is_llm_available

    if is_llm_available():
        try:
            return extract_resume_with_llm(text)
        except Exception as exc:  # network / quota / bad response -> offline fallback
            print(f"[parser] LLM parsing failed ({exc}); using heuristic parser")

    return _parse_resume_heuristic(text)


def _parse_resume_heuristic(text: str) -> dict:
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

    return {
        "candidate_name": _guess_name(text),
        "email": email_m.group(0) if email_m else None,
        "phone": phone,
        "location": location_m.group(1).strip() if location_m else None,
        "summary": _extract_summary(text),
        "skills": skills,
        "education": education_entries,
        "experience": _parse_experience(text),
        "projects": projects,
        "certifications": certifications,
        "total_experience_years": exp_years,
        "highest_education_level": highest_edu,
    }