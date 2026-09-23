"""
Google Gemini embeddings service implementation using httpx.
"""
from __future__ import annotations

import logging
from typing import Optional, Sequence
import httpx

from app.config import settings
from app.core.rag.embeddings.base import BaseEmbeddingService

logger = logging.getLogger(__name__)


class GeminiEmbeddingService(BaseEmbeddingService):
    """
    Generates embeddings using Google Gemini embeddings API (e.g. text-embedding-004).
    Requires GEMINI_API_KEY in environment or settings.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "text-embedding-004",
        dimensions: int = 768,
        timeout: float = 30.0,
    ) -> None:
        self.api_key = api_key or settings.GEMINI_API_KEY
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured. Set it in your .env or environment variables."
            )
        self._model = model_name
        self._dim = dimensions
        self._timeout = timeout

    @property
    def dimension(self) -> int:
        return self._dim

    @property
    def model_name(self) -> str:
        return self._model

    def embed_text(self, text: str) -> list[float]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:embedContent"
        params = {"key": self.api_key}
        payload = {
            "model": f"models/{self._model}",
            "content": {"parts": [{"text": text}]},
        }

        with httpx.Client(timeout=self._timeout) as client:
            resp = client.post(url, params=params, json=payload)
            resp.raise_for_status()
            data = resp.json()

        return data["embedding"]["values"]

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        # Single-call loop fallback or batchEmbedContents
        return [self.embed_text(t) for t in texts]
