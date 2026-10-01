"""Per-file embedding and Qdrant reconciliation coordinator."""

from __future__ import annotations

from app.core.chunking.models import CodeChunk
from app.core.embeddings.service import EmbeddingProvider
from app.core.vectors.store import QdrantVectorStore


class SemanticIndexer:
    def __init__(
        self,
        embedding_provider: EmbeddingProvider,
        vector_store: QdrantVectorStore,
        batch_size: int = 16,
    ) -> None:
        if batch_size < 1:
            raise ValueError("Index batch size must be positive")
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store
        self.batch_size = batch_size

    def index_file(
        self,
        repository_key: str,
        file_path: str,
        file_revision: str,
        chunks: list[CodeChunk],
    ) -> int:
        for chunk in chunks:
            if (
                chunk.repository_id != repository_key
                or chunk.file_path != file_path
                or chunk.file_revision != file_revision
            ):
                raise ValueError("Chunks must match the repository, file, and revision")

        vectors: list[list[float]] = []
        for batch_start in range(0, len(chunks), self.batch_size):
            batch = chunks[batch_start : batch_start + self.batch_size]
            vectors.extend(self.embedding_provider.embed_texts([chunk.text for chunk in batch]))

        if chunks:
            self.vector_store.upsert(chunks, vectors)
            self.vector_store.delete_stale_file_revision(
                repository_key, file_path, file_revision
            )
        else:
            self.vector_store.delete_file(repository_key, file_path)
        return len(chunks)