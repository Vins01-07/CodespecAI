"""
Deterministic mock embedding service for testing and offline local development.
"""
from __future__ import annotations

import hashlib
import math
import random
from typing import Sequence

from app.core.rag.embeddings.base import BaseEmbeddingService


class MockEmbeddingService(BaseEmbeddingService):
    """
    Generates deterministic, unit-normalized vector embeddings based on text hash.
    Requires no network access or API keys. Ideal for tests and offline environments.
    """

    def __init__(self, dimensions: int = 1536, model_name: str = "mock-embedding-v1") -> None:
        self._dim = dimensions
        self._model = model_name

    @property
    def dimension(self) -> int:
        return self._dim

    @property
    def model_name(self) -> str:
        return self._model

    def embed_text(self, text: str) -> list[float]:
        clean = text.strip()
        if not clean:
            return [0.0] * self._dim

        seed = int(hashlib.sha256(clean.encode("utf-8")).hexdigest()[:8], 16)
        rng = random.Random(seed)
        raw = [rng.uniform(-1.0, 1.0) for _ in range(self._dim)]
        norm = math.sqrt(sum(x * x for x in raw)) or 1.0
        return [round(x / norm, 6) for x in raw]

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        return [self.embed_text(t) for t in texts]
