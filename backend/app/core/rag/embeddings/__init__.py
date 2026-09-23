"""
Embeddings package for CodeSpecAI RAG Phase 4.
"""
from app.core.rag.embeddings.base import BaseEmbeddingService
from app.core.rag.embeddings.factory import get_embedding_service
from app.core.rag.embeddings.gemini_embedding import GeminiEmbeddingService
from app.core.rag.embeddings.mock_embedding import MockEmbeddingService
from app.core.rag.embeddings.openai_embedding import OpenAIEmbeddingService

__all__ = [
    "BaseEmbeddingService",
    "GeminiEmbeddingService",
    "MockEmbeddingService",
    "OpenAIEmbeddingService",
    "get_embedding_service",
]
