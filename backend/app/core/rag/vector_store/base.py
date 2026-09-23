"""
Base vector store interface for CodeSpecAI RAG.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from app.models.chunk_models import RAGChunk
from app.models.vector_models import VectorSearchResult, VectorStoreStats


class BaseVectorStore(ABC):
    """
    Abstract interface for persisting and querying vector embeddings with repository isolation.
    """

    @property
    @abstractmethod
    def index_name(self) -> str:
        """Name of the collection or index."""
        raise NotImplementedError

    @property
    @abstractmethod
    def dimensions(self) -> int:
        """Dimensionality of vectors in this store."""
        raise NotImplementedError

    @abstractmethod
    def create_or_get_collection(self, name: str, dimensions: int) -> bool:
        """Ensure the vector collection/index exists."""
        raise NotImplementedError

    @abstractmethod
    def upsert_chunks(self, chunks: list[RAGChunk], repository_id: str) -> int:
        """
        Store chunks with embeddings. Supports re-indexing without duplicate vectors.
        Returns the number of stored chunks.
        """
        raise NotImplementedError

    @abstractmethod
    def delete_repository(self, repository_id: str) -> int:
        """
        Delete all vectors and metadata belonging to a specific repository.
        Returns the number of deleted records.
        """
        raise NotImplementedError

    @abstractmethod
    def similarity_search(
        self,
        query_embedding: list[float],
        repository_id: str,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> list[VectorSearchResult]:
        """
        Query nearest neighbors isolated strictly to the given repository_id.
        """
        raise NotImplementedError

    @abstractmethod
    def count_chunks(self, repository_id: Optional[str] = None) -> int:
        """Return total chunks, optionally filtered by repository_id."""
        raise NotImplementedError

    @abstractmethod
    def get_stats(self, repository_id: Optional[str] = None) -> VectorStoreStats:
        """Return collection and repository metrics."""
        raise NotImplementedError
