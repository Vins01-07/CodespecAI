"""
OpenAI embeddings service implementation using httpx.
"""
from __future__ import annotations

import logging
from typing import Optional, Sequence
import httpx

from app.config import settings
from app.core.rag.embeddings.base import BaseEmbeddingService

logger = logging.getLogger(__name__)


class OpenAIEmbeddingService(BaseEmbeddingService):
    """
    Generates embeddings using OpenAI API (text-embedding-3-small, text-embedding-3-large).
    Requires OPENAI_API_KEY to be set in environment or settings.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "text-embedding-3-small",
        dimensions: int = 1536,
        timeout: float = 30.0,
    ) -> None:
        self.api_key = api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError(
                "OPENAI_API_KEY is not configured. Set it in your .env or environment variables."
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
        res = self.embed_batch([text])
        return res[0]

    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []

        url = "https://api.openai.com/v1/embeddings"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "input": list(texts),
            "model": self._model,
        }

        with httpx.Client(timeout=self._timeout) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        # Sort by index to maintain original order
        data_items = sorted(data["data"], key=lambda item: item["index"])
        return [item["embedding"] for item in data_items]
