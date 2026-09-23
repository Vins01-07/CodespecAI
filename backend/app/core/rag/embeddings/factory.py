"""
Factory for instantiating the configured embedding service.
"""
from __future__ import annotations

import logging
from typing import Optional

from app.config import settings
from app.core.rag.embeddings.base import BaseEmbeddingService
from app.core.rag.embeddings.gemini_embedding import GeminiEmbeddingService
from app.core.rag.embeddings.mock_embedding import MockEmbeddingService
from app.core.rag.embeddings.openai_embedding import OpenAIEmbeddingService

logger = logging.getLogger(__name__)


def get_embedding_service(
    provider: Optional[str] = None,
    model_name: Optional[str] = None,
    dimensions: Optional[int] = None,
) -> BaseEmbeddingService:
    """
    Instantiate and return the configured embedding service.
    Supported providers: 'mock', 'openai', 'gemini'.
    """
    prov = (provider or settings.EMBEDDING_PROVIDER or "mock").lower()
    dims = dimensions or settings.VECTOR_DIMENSIONS or 1536
    model = model_name or settings.EMBEDDING_MODEL_NAME

    if prov == "mock":
        return MockEmbeddingService(dimensions=dims, model_name=model or "mock-embedding-v1")
    elif prov == "openai":
        return OpenAIEmbeddingService(model_name=model or "text-embedding-3-small", dimensions=dims)
    elif prov == "gemini":
        return GeminiEmbeddingService(model_name=model or "text-embedding-004", dimensions=dims or 768)
    else:
        logger.warning("Unrecognized embedding provider '%s', falling back to mock provider", prov)
        return MockEmbeddingService(dimensions=dims, model_name=f"fallback-{prov}")
