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

_EDUCATION_PATTERNS: list[tuple[str, str, str]] = [
    (r"\bph\.?\s?d\b|doctor of philosophy", "phd", "Ph.D"),
    (
        r"\bm(?:\.\s?)?tech\b|master of (?:technology|engineering|science|business|arts|computer|administration)|"
        r"\bm\.?c\.?a\b|\bm(?:\.\s?)?s\b|\bm\.?sc\b|\bm\.?com\b|\bm\.?b\.?a\b|\bm\.?a\b|\bm\.?e\b",
        "master",
        "Master",
    ),
    (
        r"\bb(?:\.\s?)?tech\b|bachelor of (?:technology|engineering|science|business|arts|computer|administration)|"
        r"\bb\.?c\.?a\b|\bb\.?e\b|\bb(?:\.\s?)?s\b|\bb\.?sc\b|\bb\.?com\b|\bb\.?b\.?a\b|\bb\.?a\b",
        "bachelor",
        "Bachelor",
    ),
    (r"\b(?:diploma|pg ?diploma)\b", "diploma", "Diploma"),
    (
        r"\b(?:senior secondary|12th|class\s*(?:xii|12)|intermediate|higher secondary)\b",
        "senior_secondary",
        "Senior Secondary (12th)",
    ),
    (
        r"\b(?:secondary|10th|class\s*(?:x|10)|matriculation|high school)\b",
        "secondary",
        "Secondary (10th)",
    ),
]
_EDUCATION_LEVEL_RANK = {
    "none": 0,
    "secondary": 1,
    "senior_secondary": 2,
    "diploma": 3,
    "bachelor": 4,
    "master": 5,
    "phd": 6,
}

_INSTITUTION_KW = re.compile(
    r"\b(?:University|Institute(?: of [A-Za-z ]+)?|College(?: of [A-Za-z ]+)?|School|Academy|Campus|IIT|NIT|IIIT|BITS|Polytechnic|Vidyalaya|Gurukul|Kendra|Technical Campus|Faculty of [A-Za-z ]+)\b",
    re.IGNORECASE,
)

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
_YEAR_RANGE_RE = re.compile(
    r"(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2}\s*[-–—/to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:(?:19|20)\d{2}|present|current|now)",
    re.IGNORECASE,
)
_SINGLE_YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")
_GRADE_RE = re.compile(
    r"(?:cgpa|gpa|percentage|percent|score)?\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:/\s*\d+(?:\.\d+)?|%))",
    re.IGNORECASE,
)
_YEARS_CLAIM_RE = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*years?", re.IGNORECASE)

_SECTION_HEADINGS = {
    "experience": r"(?:work |professional |employment )?experience|employment history|work history",
    "education": r"education(?: & qualifications)?|academic (?:background|qualifications)|educational background",
    "projects": r"(?:academic |key |personal )?projects?",
    "certifications": r"certifications?|licenses?|courses? & certifications?|credentials?",
    "skills": r"(?:technical )?skills|technical proficienc(?:y|ies)|technologies|core competencies",
    "summary": r"(?:professional |executive |career |personal )?summary|(?:career )?objective|profile|about me|overview|biography",
    "links": r"contact links?|social links?|profiles?",
}

_KNOWN_CITIES_STATES = [
    "greater noida", "noida", "gurgaon", "gurugram", "delhi", "new delhi",
    "bengaluru", "bangalore", "hyderabad", "pune", "mumbai", "chennai", "kolkata",
    "bhagalpur", "patna", "banka", "ranchi", "jaipur", "lucknow", "ahmedabad",
    "uttar pradesh", "bihar", "karnataka", "telangana", "maharashtra", "tamil nadu",
    "haryana", "west bengal", "rajasthan", "gujarat", "india",
]

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
    links_info: list[str] = []
    seen_links: set[str] = set()

    with fitz.open(path) as doc:
        for page in doc:
            parts.append(page.get_text("text"))
            for link in page.get_links():
                uri = link.get("uri", "")
                if not uri or uri in seen_links:
                    continue
                seen_links.add(uri)
                uri_lower = uri.lower()
                if uri_lower.startswith("mailto:"):
                    email = uri[7:].split("?")[0].strip()
                    if email:
                        links_info.append(f"Email: {email}")
                elif "github.com" in uri_lower:
                    links_info.append(f"GitHub: {uri.strip()}")
                elif "linkedin.com" in uri_lower:
                    links_info.append(f"LinkedIn: {uri.strip()}")
                elif uri.startswith("http") and not any(k in uri_lower for k in ["github.com", "linkedin.com", "google.com"]):
                    links_info.append(f"Portfolio: {uri.strip()}")

    raw = "\n".join(parts)
    # Strip non-printable/corrupted font glyphs
    clean_text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", " ", raw)
    if links_info:
        clean_text += "\n\nContact Links:\n" + "\n".join(links_info)
    return clean_text


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
    cleaned = re.sub(r"^[\s•·‣▪◦\u25e6\-*§ï#\x80\x83]+", "", line).strip()
    return cleaned.strip("|•·-–—").strip()


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
    edu_section = _extract_section(text, "education") or text
    lines = [l.strip() for l in edu_section.splitlines() if l.strip()]

    blocks: list[list[str]] = []
    current_block: list[str] = []

    for line in lines:
        has_inst = any(_INSTITUTION_KW.search(l) for l in current_block)
        has_deg = any(any(re.search(pat, l, re.IGNORECASE) for pat, _, _ in _EDUCATION_PATTERNS) for l in current_block)

        is_inst = bool(_INSTITUTION_KW.search(line))
        is_deg = any(re.search(pat, line, re.IGNORECASE) for pat, _, _ in _EDUCATION_PATTERNS)

        if (is_inst and has_inst) or (is_deg and has_deg and not is_inst):
            if current_block:
                blocks.append(current_block)
                current_block = []
        current_block.append(line)

    if current_block:
        blocks.append(current_block)

    entries: list[dict] = []
    highest = "none"
    seen: set[str] = set()

    for b in blocks:
        block_text = "\n".join(b)
        degree = None
        level = "bachelor"
        degree_label = None
        institution = None
        year = None
        grade = None
        field = None
        location = None

        # 1. Year / Dates
        ym = _YEAR_RANGE_RE.search(block_text)
        if ym:
            year = ym.group(0).strip()
        else:
            ym = _SINGLE_YEAR_RE.search(block_text)
            if ym:
                year = ym.group(0).strip()

        # 2. Grade / Score
        gm = _GRADE_RE.search(block_text)
        if gm:
            for l in b:
                if re.search(r"cgpa|percentage|gpa|%", l, re.IGNORECASE):
                    grade = l.strip()
                    break
            if not grade:
                grade = gm.group(0).strip()

        # 3. Institution
        for l in b:
            if _INSTITUTION_KW.search(l):
                inst_cand = _extract_institution(l)
                if not inst_cand:
                    cleaned_inst = re.sub(
                        r"\b(?:July|Jan|Feb|Mar|Apr|May|Jun|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\b",
                        "",
                        l,
                        flags=re.IGNORECASE,
                    )
                    cleaned_inst = re.sub(r"(?:19|20)\d{2}", "", cleaned_inst)
                    inst_cand = cleaned_inst.strip(" –-|,")

                if inst_cand and "," in inst_cand:
                    p_parts = [p.strip() for p in inst_cand.split(",") if p.strip()]
                    if len(p_parts) > 1 and any(c in p_parts[-1].lower() for c in _KNOWN_CITIES_STATES):
                        if not location:
                            location = p_parts[-1]
                        inst_cand = ", ".join(p_parts[:-1])

                if inst_cand:
                    institution = inst_cand
                    break

        # 4. Degree, Field, Location
        for l in b:
            for pat, lvl, label in _EDUCATION_PATTERNS:
                m = re.search(pat, l, re.IGNORECASE)
                if m:
                    level = lvl
                    degree_label = label
                    parts = re.split(r"[,–—|-]", l)
                    degree = parts[0].strip()
                    rem_parts = [p.strip() for p in parts[1:] if p.strip()]
                    for p in rem_parts:
                        p_lower = p.lower()
                        if any(c in p_lower for c in _KNOWN_CITIES_STATES):
                            if not location:
                                location = p
                            else:
                                location = f"{location}, {p}"
                        elif not field and not _INSTITUTION_KW.search(p):
                            field = p
                    break
            if degree:
                break

        entry_key = (degree or degree_label or "").lower()
        if entry_key and entry_key in seen:
            continue
        seen.add(entry_key)

        entries.append({
            "degree": degree or degree_label or "Degree",
            "institution": institution,
            "field_of_study": field,
            "year": year,
            "grade": grade,
            "location": location,
            "level": level,
        })

        if _EDUCATION_LEVEL_RANK.get(level, 0) > _EDUCATION_LEVEL_RANK.get(highest, 0):
            highest = level

    if highest in ["secondary", "senior_secondary"]:
        highest_normalized = "high_school"
    else:
        highest_normalized = highest

    return entries, highest_normalized


# ---------- Summary ----------

def _extract_summary(text: str) -> str | None:
    section = _extract_section(text, "summary")
    if section:
        clean_lines: list[str] = []
        for line in section.splitlines():
            l_clean = _clean_line(line)
            if not l_clean:
                continue
            # Filter out stray contact icons or social URLs
            if re.search(r"\b(github|linkedin|gmail|portfolio|\+?\d{10})\b", l_clean, re.IGNORECASE):
                continue
            clean_lines.append(l_clean)
        cleaned = " ".join(clean_lines).strip()
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        if len(cleaned) > 25:
            return cleaned[:800]

    # Conservative fallback: only search first 25 lines of the resume and only if it matches summary phrasing
    _SUMMARY_INDICATORS = re.compile(
        r"\b(?:engineer|developer|architect|student|graduate|passionate|experienced|proven|seeking|motivated|focused|enthusiastic|specialized|expertise|background)\b",
        re.IGNORECASE,
    )
    for line in text.splitlines()[:25]:
        line = _clean_line(line)
        if 50 < len(line) < 400 and "@" not in line:
            if re.search(r"\b(github|linkedin|gmail|portfolio|\+?\d{10})\b", line, re.IGNORECASE):
                continue
            if re.match(r"^(?:{})".format("|".join(_SECTION_HEADINGS.values())), line, re.IGNORECASE):
                continue
            if _SUMMARY_INDICATORS.search(line):
                return re.sub(r"\s+", " ", line).strip()[:800]
    return None


# ---------- Projects & Certifications ----------

def _parse_projects(text: str) -> list[dict]:
    body = _extract_section(text, "projects")
    if not body:
        return []

    lines = [l.strip() for l in body.splitlines() if l.strip()]
    projects: list[dict] = []
    cur_proj: dict | None = None

    for l in lines:
        is_bullet = bool(re.match(r"^[•·‣▪◦\u25e6\-*]|\d+\.", l))
        cleaned = _clean_line(l)
        if not cleaned:
            continue

        if re.match(r"^tools?\s*(?:used)?\s*:", cleaned, re.IGNORECASE):
            if cur_proj:
                cur_proj["tools"] = cleaned.split(":", 1)[1].strip()
            continue

        if re.match(r"^(?:19|20)\d{2}$", cleaned):
            if cur_proj and not cur_proj.get("year"):
                cur_proj["year"] = cleaned
            continue

        if ":" in cleaned and not cleaned.lower().startswith("tools"):
            parts = cleaned.split(":", 1)
            cand_title = parts[0].strip()
            if 2 < len(cand_title) <= 70 and not any(cand_title.lower().startswith(x) for x in ["http", "email", "phone", "note"]):
                if cur_proj:
                    projects.append(cur_proj)
                cur_proj = {
                    "title": cand_title,
                    "year": None,
                    "tools": None,
                    "highlights": [parts[1].strip()] if parts[1].strip() else [],
                    "description": parts[1].strip(),
                }
                continue

        if not is_bullet and len(cleaned) < 100 and any(sep in cleaned for sep in ["|", "–", " - ", "—"]):
            if cur_proj:
                projects.append(cur_proj)
            raw_title = re.split(r"[|–—]|\s-\s", cleaned)[0].strip()
            cur_proj = {
                "title": raw_title,
                "year": None,
                "tools": None,
                "highlights": [],
                "description": "",
            }
        elif not is_bullet and not cur_proj and len(cleaned) < 80:
            cur_proj = {
                "title": cleaned,
                "year": None,
                "tools": None,
                "highlights": [],
                "description": "",
            }
        elif is_bullet:
            if cur_proj:
                cur_proj["highlights"].append(cleaned)
            else:
                cur_proj = {
                    "title": cleaned.split(":")[0][:80],
                    "year": None,
                    "tools": None,
                    "highlights": [cleaned],
                    "description": "",
                }
        else:
            if cur_proj:
                cur_proj["highlights"].append(cleaned)

    if cur_proj:
        projects.append(cur_proj)

    for p in projects:
        p["description"] = " ".join(p["highlights"])[:600]

    return projects[:10]


def _parse_certifications(text: str) -> list[dict]:
    body = _extract_section(text, "certifications")
    if not body:
        return []

    lines = [l.strip() for l in body.splitlines() if l.strip()]
    certs: list[dict] = []
    cur_cert: dict | None = None

    for l in lines:
        cleaned = _clean_line(l)
        if not cleaned:
            continue
        # Skip contact links or URLs that might follow or appear in certs
        if any(w in cleaned.lower() for w in ["contact links", "github", "linkedin", "mailto", "portfolio", "http://", "https://"]):
            continue
        is_date = bool(
            re.match(
                r"^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:19|20)\d{2}$",
                cleaned,
                re.IGNORECASE,
            )
        )

        if is_date:
            if cur_cert:
                cur_cert["date"] = cleaned
                certs.append(cur_cert)
                cur_cert = None
        else:
            if cur_cert:
                certs.append(cur_cert)
            cur_cert = {"name": cleaned, "date": None}

    if cur_cert:
        certs.append(cur_cert)

    return certs[:15]


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

    education_entries, highest_edu = _parse_education(text)
    exp_years = _parse_experience_years(text)

    # Location resolution: explicit -> header (non-institution) -> primary education
    location = None
    location_m = re.search(
        r"(?:location|address|based in)\s*[:\-]\s*([A-Za-z .,'-]{3,80})", text, re.IGNORECASE
    )
    if location_m:
        location = location_m.group(1).strip()
    else:
        for line in text.splitlines()[:15]:
            l_clean = _clean_line(line)
            # Never confuse an institution or degree line with a candidate city location
            if _INSTITUTION_KW.search(l_clean) or any(re.search(pat, l_clean, re.IGNORECASE) for pat, _, _ in _EDUCATION_PATTERNS):
                continue
            l_lower = l_clean.lower()
            for cs in _KNOWN_CITIES_STATES:
                if cs != "india" and cs in l_lower:
                    location = l_clean
                    break
            if location:
                break

    if not location and education_entries:
        for ed in education_entries:
            if ed.get("location"):
                location = ed["location"]
                break

    # Social & portfolio links
    links: dict[str, str] = {}
    gh_m = re.search(r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_-]+", text, re.IGNORECASE)
    if gh_m:
        val = gh_m.group(0).strip()
        links["github"] = val if val.startswith("http") else f"https://{val}"

    li_m = re.search(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[A-Za-z0-9_%-]+", text, re.IGNORECASE)
    if li_m:
        val = li_m.group(0).strip()
        links["linkedin"] = val if val.startswith("http") else f"https://{val}"

    pf_m = re.search(
        r"(?:https?://)?(?:www\.)?(?!github\.com|linkedin\.com)[A-Za-z0-9_.-]+\.(?:site|dev|me|online|vercel\.app|app|io|tech)(?:/[A-Za-z0-9_.-]*)?",
        text,
        re.IGNORECASE,
    )
    if pf_m:
        val = pf_m.group(0).strip()
        links["portfolio"] = val if val.startswith("http") else f"https://{val}"

    # Also resolve any links or email appended from PDF annotations
    detected_email = email_m.group(0) if email_m else None
    for line in text.splitlines():
        if line.startswith("Email: ") and not detected_email:
            detected_email = line[7:].strip()
        elif line.startswith("GitHub: ") and "github" not in links:
            links["github"] = line[8:].strip()
        elif line.startswith("LinkedIn: ") and "linkedin" not in links:
            links["linkedin"] = line[10:].strip()
        elif line.startswith("Portfolio: ") and "portfolio" not in links:
            links["portfolio"] = line[11:].strip()

    projects = _parse_projects(text)
    certifications = _parse_certifications(text)

    return {
        "candidate_name": _guess_name(text),
        "email": detected_email,
        "phone": phone,
        "location": location,
        "summary": _extract_summary(text),
        "skills": skills,
        "education": education_entries,
        "experience": _parse_experience(text),
        "projects": projects,
        "certifications": certifications,
        "links": links,
        "total_experience_years": exp_years,
        "highest_education_level": highest_edu,
    }