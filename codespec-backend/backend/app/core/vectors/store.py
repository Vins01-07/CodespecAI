"""Qdrant adapter with mandatory repository filtering and safe initialization."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from app.config import settings
from app.core.chunking.models import CodeChunk


class VectorStoreError(RuntimeError):
    """Raised when the vector collection or an operation is invalid/unavailable."""


@dataclass(frozen=True)
class VectorHit:
    point_id: str
    score: float
    payload: dict[str, Any]


class QdrantVectorStore:
    PAYLOAD_INDEX_FIELDS = ("repository_id", "file_path", "entity_id", "entity_type", "file_revision")

    def __init__(
        self,
        client: Any | None = None,
        collection_name: str = settings.QDRANT_COLLECTION,
        vector_size: int = settings.QDRANT_VECTOR_SIZE,
        url: str = settings.QDRANT_URL,
        api_key: str | None = settings.QDRANT_API_KEY,
        timeout: float = settings.QDRANT_TIMEOUT_SECONDS,
    ) -> None:
        self.collection_name = collection_name
        self.vector_size = vector_size
        self._client = client
        self._client_options = {"url": url, "api_key": api_key, "timeout": timeout}

    @property
    def client(self) -> Any:
        if self._client is None:
            try:
                from qdrant_client import QdrantClient

                self._client = QdrantClient(**self._client_options)
            except Exception as exc:
                raise VectorStoreError("Qdrant client could not be initialized") from exc
        return self._client

    @staticmethod
    def _models() -> Any:
        try:
            from qdrant_client import models

            return models
        except ImportError as exc:
            raise VectorStoreError("qdrant-client is not installed") from exc

    def ensure_collection(self) -> None:
        models = self._models()
        try:
            if not self.client.collection_exists(self.collection_name):
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config={
                        "dense": models.VectorParams(
                            size=self.vector_size, distance=models.Distance.COSINE
                        )
                    },
                )
            else:
                collection = self.client.get_collection(self.collection_name)
                vectors = collection.config.params.vectors
                dense = vectors.get("dense") if isinstance(vectors, dict) else None
                if dense is None or dense.size != self.vector_size:
                    raise VectorStoreError("Existing Qdrant collection has incompatible vectors")
                distance = getattr(dense.distance, "value", dense.distance)
                if str(distance).lower() != "cosine":
                    raise VectorStoreError("Existing Qdrant collection must use cosine distance")

            for field_name in self.PAYLOAD_INDEX_FIELDS:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field_name,
                    field_schema=models.PayloadSchemaType.KEYWORD,
                    wait=True,
                )
        except VectorStoreError:
            raise
        except Exception as exc:
            raise VectorStoreError("Qdrant collection initialization failed") from exc

    def upsert(self, chunks: list[CodeChunk], vectors: list[list[float]]) -> None:
        if len(chunks) != len(vectors):
            raise ValueError("Each chunk must have exactly one embedding")
        models = self._models()
        points = []
        for chunk, vector in zip(chunks, vectors, strict=True):
            self._validate_vector(vector)
            points.append(
                models.PointStruct(
                    id=chunk.chunk_id,
                    vector={"dense": vector},
                    payload={
                        "repository_id": chunk.repository_id,
                        "file_path": chunk.file_path,
                        "entity_id": chunk.entity_id,
                        "entity_name": chunk.entity_name,
                        "entity_type": chunk.entity_type,
                        "language": chunk.language,
                        "start_line": chunk.start_line,
                        "end_line": chunk.end_line,
                        "chunk_index": chunk.chunk_index,
                        "content_hash": chunk.content_hash,
                        "file_revision": chunk.file_revision,
                        "text": chunk.text,
                    },
                )
            )
        try:
            if points:
                self.client.upsert(
                    collection_name=self.collection_name, points=points, wait=True
                )
        except Exception as exc:
            raise VectorStoreError("Qdrant upsert failed") from exc

    def delete_stale_file_revision(
        self, repository_key: str, file_path: str, current_revision: str
    ) -> None:
        models = self._models()
        selector = models.FilterSelector(
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="repository_id", match=models.MatchValue(value=repository_key)
                    ),
                    models.FieldCondition(
                        key="file_path", match=models.MatchValue(value=file_path)
                    ),
                ],
                must_not=[
                    models.FieldCondition(
                        key="file_revision", match=models.MatchValue(value=current_revision)
                    )
                ],
            )
        )
        self._delete(selector)

    def delete_file(self, repository_key: str, file_path: str) -> None:
        self._delete_filter(
            repository_key,
            models_filter={"file_path": file_path},
        )

    def delete_repository(self, repository_key: str) -> None:
        self._delete_filter(repository_key)

    def _delete_filter(self, repository_key: str, models_filter: dict[str, str] | None = None) -> None:
        models = self._models()
        conditions = [
            models.FieldCondition(
                key="repository_id", match=models.MatchValue(value=repository_key)
            )
        ]
        for key, value in (models_filter or {}).items():
            conditions.append(models.FieldCondition(key=key, match=models.MatchValue(value=value)))
        self._delete(models.FilterSelector(filter=models.Filter(must=conditions)))

    def _delete(self, selector: Any) -> None:
        try:
            self.client.delete(
                collection_name=self.collection_name, points_selector=selector, wait=True
            )
        except Exception as exc:
            raise VectorStoreError("Qdrant delete failed") from exc

    def search(
        self,
        repository_key: str,
        vector: list[float],
        top_k: int,
        score_threshold: float = 0.0,
    ) -> list[VectorHit]:
        self._validate_vector(vector)
        if not repository_key:
            raise ValueError("Repository filter is required for vector search")
        models = self._models()
        query_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="repository_id", match=models.MatchValue(value=repository_key)
                )
            ]
        )
        try:
            response = self.client.query_points(
                collection_name=self.collection_name,
                query=vector,
                using="dense",
                query_filter=query_filter,
                limit=top_k,
                score_threshold=score_threshold,
                with_payload=True,
            )
        except Exception as exc:
            raise VectorStoreError("Qdrant search failed") from exc
        return [
            VectorHit(str(point.id), float(point.score), dict(point.payload or {}))
            for point in response.points
        ]

    def get_chunks_for_entities(
        self, repository_key: str, entity_ids: list[str], limit: int = 500
    ) -> list[VectorHit]:
        if not repository_key or not entity_ids:
            return []
        models = self._models()
        scroll_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="repository_id", match=models.MatchValue(value=repository_key)
                ),
                models.FieldCondition(
                    key="entity_id", match=models.MatchAny(any=entity_ids)
                ),
            ]
        )
        hits: list[VectorHit] = []
        offset = None
        try:
            while len(hits) < limit:
                points, offset = self.client.scroll(
                    collection_name=self.collection_name,
                    scroll_filter=scroll_filter,
                    limit=min(128, limit - len(hits)),
                    offset=offset,
                    with_payload=True,
                    with_vectors=False,
                )
                hits.extend(
                    VectorHit(str(point.id), 0.0, dict(point.payload or {}))
                    for point in points
                )
                if offset is None or not points:
                    break
        except Exception as exc:
            raise VectorStoreError("Qdrant entity lookup failed") from exc
        return hits[:limit]

    def list_repository_files(self, repository_key: str) -> set[str]:
        models = self._models()
        file_paths: set[str] = set()
        offset = None
        repository_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="repository_id", match=models.MatchValue(value=repository_key)
                )
            ]
        )
        try:
            while True:
                points, offset = self.client.scroll(
                    collection_name=self.collection_name,
                    scroll_filter=repository_filter,
                    limit=256,
                    offset=offset,
                    with_payload=["file_path"],
                    with_vectors=False,
                )
                file_paths.update(
                    str(point.payload["file_path"])
                    for point in points
                    if point.payload and point.payload.get("file_path")
                )
                if offset is None or not points:
                    return file_paths
        except Exception as exc:
            raise VectorStoreError("Qdrant repository scan failed") from exc

    def delete_missing_files(self, repository_key: str, current_file_paths: set[str]) -> None:
        for stale_path in self.list_repository_files(repository_key) - current_file_paths:
            self.delete_file(repository_key, stale_path)

    def _validate_vector(self, vector: list[float]) -> None:
        if len(vector) != self.vector_size or not all(math.isfinite(value) for value in vector):
            raise ValueError("Embedding vector has invalid dimension or values")