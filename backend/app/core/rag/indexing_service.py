"""
Indexing service coordinating embedding generation and vector store persistence.
"""
from __future__ import annotations

import logging
from typing import Optional

from app.core.rag.embeddings.base import BaseEmbeddingService
from app.core.rag.embeddings.factory import get_embedding_service
from app.core.rag.vector_store.base import BaseVectorStore
from app.core.rag.vector_store.factory import get_vector_store
from app.models.chunk_models import RAGChunk
from app.models.vector_models import IndexingResult, VectorSearchResult, VectorStoreStats

logger = logging.getLogger(__name__)


class IndexingService:
    """
    Coordinates embedding generation and vector store persistence for RAG chunks.
    Ensures repository isolation, idempotent re-indexing, and graceful failure handling.
    """

    def __init__(
        self,
        embedding_service: Optional[BaseEmbeddingService] = None,
        vector_store: Optional[BaseVectorStore] = None,
    ) -> None:
        self.embedding_service: BaseEmbeddingService = embedding_service or get_embedding_service()
        self.vector_store: BaseVectorStore = vector_store or get_vector_store()

    def index_chunks(
        self,
        chunks: list[RAGChunk],
        repository_id: str,
        batch_size: int = 64,
    ) -> IndexingResult:
        """
        Embed a list of RAG chunks and persist them into the vector store.
        Re-indexing automatically cleans previous chunks for the repository without creating duplicate vectors.
        """
        if not repository_id:
            return IndexingResult(
                repository_id="",
                chunks_indexed=0,
                dimensions=self.embedding_service.dimension,
                provider=self.embedding_service.model_name,
                index_name=self.vector_store.index_name,
                is_successful=False,
                error="repository_id is mandatory for vector indexing",
            )

        if not chunks:
            return IndexingResult(
                repository_id=repository_id,
                chunks_indexed=0,
                dimensions=self.embedding_service.dimension,
                provider=self.embedding_service.model_name,
                index_name=self.vector_store.index_name,
                is_successful=True,
            )

        try:
            logger.info(
                "Embedding %d chunks for repo %s using %s...",
                len(chunks),
                repository_id,
                self.embedding_service.model_name,
            )
            # 1. Batch generate embeddings
            embedded_chunks = self.embedding_service.embed_chunks(chunks, batch_size=batch_size)

            # 2. Persist in vector store (with re-index deduplication)
            stored_count = self.vector_store.upsert_chunks(embedded_chunks, repository_id=repository_id)

            logger.info("Successfully persisted %d chunks for %s", stored_count, repository_id)
            return IndexingResult(
                repository_id=repository_id,
                chunks_indexed=stored_count,
                dimensions=self.embedding_service.dimension,
                provider=self.embedding_service.model_name,
                index_name=self.vector_store.index_name,
                is_successful=True,
            )
        except Exception as exc:
            logger.error("Failed to index chunks for %s: %s", repository_id, exc, exc_info=True)
            return IndexingResult(
                repository_id=repository_id,
                chunks_indexed=0,
                dimensions=self.embedding_service.dimension,
                provider=self.embedding_service.model_name,
                index_name=self.vector_store.index_name,
                is_successful=False,
                error=str(exc),
            )

    def delete_repository(self, repository_id: str) -> int:
        """Remove all vectors and chunk metadata for a given repository."""
        if not repository_id:
            return 0
        return self.vector_store.delete_repository(repository_id)

    def similarity_search(
        self,
        query: str,
        repository_id: str,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> list[VectorSearchResult]:
        """
        Embed search query and retrieve most similar chunks scoped strictly to repository_id.
        """
        if not repository_id or not query.strip():
            return []

        try:
            query_vector = self.embedding_service.embed_text(query)
            return self.vector_store.similarity_search(
                query_embedding=query_vector,
                repository_id=repository_id,
                top_k=top_k,
                min_score=min_score,
            )
        except Exception as exc:
            logger.error("Similarity search failed for repo %s: %s", repository_id, exc, exc_info=True)
            return []

    def get_stats(self, repository_id: Optional[str] = None) -> VectorStoreStats:
        """Retrieve metrics for the vector store index."""
        return self.vector_store.get_stats(repository_id)
