"""
Base embedding service interface for CodeSpecAI RAG.
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Sequence

from app.models.chunk_models import RAGChunk

logger = logging.getLogger(__name__)


class BaseEmbeddingService(ABC):
    """Abstract interface for generating vector embeddings."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Dimensionality of produced vector embeddings."""
        raise NotImplementedError

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Name of the embedding model."""
        raise NotImplementedError

    @abstractmethod
    def embed_text(self, text: str) -> list[float]:
        """Generate vector embedding for a single text string."""
        raise NotImplementedError

    @abstractmethod
    def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Generate vector embeddings for a batch of text strings."""
        raise NotImplementedError

    def embed_chunk(self, chunk: RAGChunk) -> RAGChunk:
        """Compute and attach vector embedding to a RAGChunk."""
        chunk.embedding = self.embed_text(chunk.content)
        return chunk

    def embed_chunks(self, chunks: list[RAGChunk], batch_size: int = 64) -> list[RAGChunk]:
        """
        Compute and attach vector embeddings to a list of RAGChunks in batches.
        """
        if not chunks:
            return []

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            texts = [c.content for c in batch]
            embeddings = self.embed_batch(texts)
            for chunk, emb in zip(batch, embeddings):
                chunk.embedding = emb

        return chunks
