"""
In-memory vector store implementation with exact cosine similarity search.
Used for offline development, local fallbacks, and fast unit testing.
"""
from __future__ import annotations

import math
from typing import Optional

from app.core.rag.vector_store.base import BaseVectorStore
from app.models.chunk_models import RAGChunk
from app.models.vector_models import VectorSearchResult, VectorStoreStats


def _cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """Compute cosine similarity between two float vectors normalized to [0.0, 1.0]."""
    if len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    cos = max(-1.0, min(1.0, dot / (norm1 * norm2)))
    # Map from [-1.0, 1.0] to [0.0, 1.0]
    return (cos + 1.0) / 2.0


class InMemoryVectorStore(BaseVectorStore):
    """
    Ephemerally persists chunk embeddings in memory.
    Enforces strict repository isolation: queries against repository A
    will never access chunks belonging to repository B.
    """

    def __init__(self, index_name: str = "rag_chunk_embeddings", dimensions: int = 1536) -> None:
        self._index_name = index_name
        self._dimensions = dimensions
        # Internal storage: repository_id -> {chunk_id: RAGChunk}
        self._repos: dict[str, dict[str, RAGChunk]] = {}

    @property
    def index_name(self) -> str:
        return self._index_name

    @property
    def dimensions(self) -> int:
        return self._dimensions

    def create_or_get_collection(self, name: str, dimensions: int) -> bool:
        self._index_name = name
        self._dimensions = dimensions
        return True

    def upsert_chunks(self, chunks: list[RAGChunk], repository_id: str) -> int:
        if not chunks:
            return 0

        repo_dict = self._repos.setdefault(repository_id, {})
        count = 0
        for chunk in chunks:
            if chunk.embedding is not None:
                # Key by chunk_id to avoid duplicate vectors on re-indexing
                repo_dict[chunk.chunk_id] = chunk.model_copy()
                count += 1
        return count

    def delete_repository(self, repository_id: str) -> int:
        if repository_id in self._repos:
            count = len(self._repos[repository_id])
            del self._repos[repository_id]
            return count
        return 0

    def similarity_search(
        self,
        query_embedding: list[float],
        repository_id: str,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> list[VectorSearchResult]:
        repo_chunks = self._repos.get(repository_id, {})
        if not repo_chunks:
            return []

        scored: list[tuple[RAGChunk, float]] = []
        for chunk in repo_chunks.values():
            if chunk.embedding is None:
                continue
            score = _cosine_similarity(query_embedding, chunk.embedding)
            if score >= min_score:
                scored.append((chunk, score))

        # Sort descending by similarity score
        scored.sort(key=lambda x: x[1], reverse=True)

        return [
            VectorSearchResult(chunk=chunk, score=round(score, 4))
            for chunk, score in scored[:top_k]
        ]

    def count_chunks(self, repository_id: Optional[str] = None) -> int:
        if repository_id:
            return len(self._repos.get(repository_id, {}))
        return sum(len(chunks) for chunks in self._repos.values())

    def get_stats(self, repository_id: Optional[str] = None) -> VectorStoreStats:
        total = self.count_chunks()
        repo_cnt = self.count_chunks(repository_id) if repository_id else 0
        return VectorStoreStats(
            total_chunks=total,
            repository_chunks=repo_cnt,
            index_name=self._index_name,
            dimensions=self._dimensions,
        )
