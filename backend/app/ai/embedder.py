"""Semantic similarity via sentence-transformers, with graceful fallback."""

from __future__ import annotations

import threading
from difflib import SequenceMatcher

from app.core.config import settings

_lock = threading.Lock()
_model = None
_load_failed = False


def _load_model():
    global _model, _load_failed
    if _model is not None or _load_failed or not settings.SENTENCE_TRANSFORMER_MODEL:
        return _model
    with _lock:
        if _model is not None or _load_failed:
            return _model
        try:
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer(settings.SENTENCE_TRANSFORMER_MODEL)
        except Exception as exc:  # offline / download failure -> fallback mode
            print(f"[embedder] sentence-transformers unavailable ({exc}); using fuzzy fallback")
            _load_failed = True
    return _model


def embed(text: str) -> list[float] | None:
    """Embed *text*; returns None when embeddings are unavailable."""
    model = _load_model()
    if model is None:
        return None
    vec = model.encode(text[:2000], normalize_embeddings=True)
    return vec.tolist()


def semantic_similarity(text_a: str, text_b: str) -> float:
    """Cosine similarity of embeddings in [0, 1]; fuzzy string ratio fallback."""
    va = embed(text_a)
    vb = embed(text_b)
    if va is None or vb is None:
        return max(0.0, SequenceMatcher(None, text_a.lower()[:1500], text_b.lower()[:1500]).ratio())
    dot = sum(x * y for x, y in zip(va, vb))
    return round(max(0.0, min(1.0, (dot + 1.0) / 2.0)), 4)


def is_semantic_available() -> bool:
    return settings.SENTENCE_TRANSFORMER_MODEL != ""
