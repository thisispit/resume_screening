"""Skill taxonomy with aliases and text extraction.

A canonical skill maps to a list of alias spellings. Extraction is
case/separator-insensitive word-boundary matching over free text.
"""

from __future__ import annotations

import re

SKILL_TAXONOMY: dict[str, list[str]] = {
    # Programming languages
    "python": ["python", "python3"],
    "java": ["java"],
    "javascript": ["javascript", "js", "es6"],
    "typescript": ["typescript", "ts"],
    "c++": ["c\\+\\+", "cpp"],
    "c#": ["c#", "c sharp", "csharp"],
    "go": ["golang", "go lang"],
    "rust": ["rust"],
    "php": ["php"],
    "ruby": ["ruby"],
    "kotlin": ["kotlin"],
    "swift": ["swift"],
    "scala": ["scala"],
    "r": ["r language", "rstudio"],
    "sql": ["sql"],
    "bash": ["bash", "shell scripting", "shell"],
    # Web frameworks
    "react": ["react", "react\\.js", "reactjs"],
    "angular": ["angular", "angularjs"],
    "vue": ["vue", "vue\\.js", "vuejs"],
    "next.js": ["next\\.js", "nextjs"],
    "node.js": ["node\\.js", "nodejs", "node"],
    "express": ["express", "express\\.js", "expressjs"],
    "django": ["django"],
    "flask": ["flask"],
    "fastapi": ["fastapi", "fast api"],
    "spring boot": ["spring boot", "springboot", "spring"],
    ".net": ["\\.net", "dotnet", "asp\\.net"],
    "html/css": ["html", "css", "html5", "css3", "html/css", "sass", "scss", "tailwind"],
    "bootstrap": ["bootstrap"],
    # Data science / ML
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning"],
    "nlp": ["nlp", "natural language processing"],
    "computer vision": ["computer vision", "opencv"],
    "pytorch": ["pytorch", "torch"],
    "tensorflow": ["tensorflow", "keras"],
    "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "matplotlib": ["matplotlib", "seaborn"],
    "data analysis": ["data analysis", "data analytics", "exploratory data analysis", "eda"],
    "data visualization": ["data visualization", "tableau", "power bi", "powerbi"],
    "statistics": ["statistics", "statistical"],
    "hugging face": ["hugging ?face", "transformers"],
    "langchain": ["langchain"],
    "generative ai": ["generative ai", "genai", "gen ai", "llm", "large language model"],
    # Databases
    "postgresql": ["postgres", "postgresql"],
    "mysql": ["mysql", "mariadb"],
    "mongodb": ["mongodb", "mongo"],
    "redis": ["redis"],
    "sqlite": ["sqlite"],
    "oracle": ["oracle"],
    "sql server": ["sql server", "mssql"],
    # Cloud / devops
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "gcp": ["gcp", "google cloud"],
    "docker": ["docker", "containerization"],
    "kubernetes": ["kubernetes", "k8s"],
    "ci/cd": ["ci/?cd", "jenkins", "github actions", "gitlab ci"],
    "terraform": ["terraform"],
    "linux": ["linux", "ubuntu", "unix"],
    "git": ["git", "github", "gitlab", "bitbucket"],
    "nginx": ["nginx"],
    # Practices
    "rest api": ["rest", "rest api", "restful"],
    "graphql": ["graphql"],
    "microservices": ["microservices", "micro-services"],
    "agile": ["agile", "scrum", "kanban"],
    "tdd": ["tdd", "test driven development", "unit testing", "pytest", "junit"],
    "system design": ["system design", "distributed systems"],
    # Mobile
    "android": ["android"],
    "ios": ["ios development", "swiftui"],
    "flutter": ["flutter", "dart"],
    "react native": ["react native", "react-native"],
    # Soft / business
    "communication": ["communication"],
    "leadership": ["leadership", "team lead"],
    "problem solving": ["problem solving", "problem-solving"],
    "teamwork": ["teamwork", "collaboration"],
}

# canonical skill -> compiled regex matching any of its aliases
_SKILL_PATTERNS: dict[str, re.Pattern] = {}

for _canonical, _aliases in SKILL_TAXONOMY.items():
    _parts = sorted(set(_aliases + [_canonical]), key=len, reverse=True)
    _joined = "|".join(rf"\b{_a}\b" for _a in _parts)
    _SKILL_PATTERNS[_canonical] = re.compile(_joined, re.IGNORECASE)


def extract_skills(text: str) -> list[str]:
    """Return the canonical skills found in *text* (order preserved)."""
    found: list[str] = []
    for canonical, pattern in _SKILL_PATTERNS.items():
        if pattern.search(text):
            found.append(canonical)
    return found


def normalize_skill(skill: str) -> str:
    """Normalize a free-form skill string for comparison."""
    return re.sub(r"[^a-z0-9+# ]", "", skill.strip().lower())


def skill_matches(candidate_skill: str, required_skill: str) -> bool:
    """Alias-aware check of whether a resume skill satisfies a required skill."""
    req = normalize_skill(required_skill)
    cand = normalize_skill(candidate_skill)
    if not req or not cand:
        return False
    if req == cand:
        return True
    pattern = _SKILL_PATTERNS.get(req)
    if pattern is None:
        return False
    return bool(pattern.fullmatch(cand)) or bool(pattern.search(cand))


def match_skills(resume_skills: list[str], required_skills: list[str]) -> tuple[list[str], list[str]]:
    """Return (matched_required, missing_required) using alias-aware matching."""
    matched, missing = [], []
    for req in required_skills:
        if any(skill_matches(rs, req) for rs in resume_skills):
            matched.append(req)
        else:
            missing.append(req)
    return matched, missing
