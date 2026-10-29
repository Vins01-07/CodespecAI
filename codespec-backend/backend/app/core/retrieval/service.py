"""Hybrid retrieval with Reciprocal Rank Fusion (RRF) and Redis context caching."""

from __future__ import annotations

import logging
from collections import defaultdict
from uuid import uuid4

from app.core.embeddings.service import EmbeddingError, EmbeddingProvider
from app.core.repository_identity import repository_id
from app.core.retrieval.cache import RedisContextCache
from app.core.retrieval.graph import GraphRetrievalError, Neo4jGraphRetriever
from app.core.vectors.store import QdrantVectorStore, VectorHit, VectorStoreError
from app.models.retrieval import (
    ContextItem,
    GraphEvidence,
    HybridRetrievalResponse,
    RetrievalGraphPath,
)

logger = logging.getLogger(__name__)


class RetrievalUnavailable(RuntimeError):
    """Raised when semantic or structural retrieval cannot be completed."""


class HybridRetrievalService:
    def __init__(
        self,
        embedding_provider: EmbeddingProvider,
        vector_store: QdrantVectorStore,
        graph_retriever: Neo4jGraphRetriever,
        score_threshold: float = 0.0,
        cache: RedisContextCache | None = None,
        rrf_k: int = 60,
        semantic_weight: float = 1.0,
        graph_weight: float = 1.0,
    ) -> None:
        self.embedding_provider = embedding_provider
        self.vector_store = vector_store
        self.graph_retriever = graph_retriever
        self.score_threshold = score_threshold
        self.cache = cache
        self.rrf_k = rrf_k
        self.semantic_weight = semantic_weight
        self.graph_weight = graph_weight

    def search(
        self,
        repo_url: str,
        query: str,
        top_k: int = 8,
        graph_depth: int = 1,
        max_context_chars: int = 12000,
    ) -> HybridRetrievalResponse:
        if not repo_url.strip() or not query.strip():
            raise ValueError("Repository key and query are required")
        top_k = min(max(top_k, 1), 50)
        graph_depth = min(max(graph_depth, 0), 4)
        max_context_chars = min(max(max_context_chars, 100), 200000)
        repo_id = repository_id(repo_url)

        # 1. Check Redis Context Cache for warm sub-250ms response
        cache_key: str | None = None
        if self.cache and self.cache.enabled:
            cache_key = self.cache.generate_key(
                repo_id=repo_id,
                query=query,
                top_k=top_k,
                graph_depth=graph_depth,
                max_context_chars=max_context_chars,
            )
            cached_result = self.cache.get(cache_key)
            if cached_result is not None:
                logger.debug("Cache hit for context query on repo %s", repo_id)
                return cached_result

        # 2. Execute Hybrid Retrieval Pipeline
        try:
            query_vector = self.embedding_provider.embed_texts([query])[0]
            semantic_hits = self.vector_store.search(
                repo_id, query_vector, top_k=top_k, score_threshold=self.score_threshold
            )
            seed_ids = list(
                dict.fromkeys(
                    str(hit.payload.get("entity_id"))
                    for hit in semantic_hits
                    if hit.payload.get("entity_id")
                    and hit.payload.get("entity_type") in {"class", "function", "method", "file"}
                )
            )
            graph_evidence = self.graph_retriever.expand(
                repo_url, seed_ids, depth=graph_depth, limit=top_k * 10
            )
            graph_hits = self.vector_store.get_chunks_for_entities(
                repo_id, [evidence.entity_id for evidence in graph_evidence], limit=top_k * 20
            )
        except (EmbeddingError, VectorStoreError, GraphRetrievalError) as exc:
            logger.warning("Hybrid retrieval unavailable (%s)", type(exc).__name__)
            raise RetrievalUnavailable("Hybrid retrieval is temporarily unavailable") from exc

        graph_by_entity: dict[str, list[GraphEvidence]] = defaultdict(list)
        for evidence in graph_evidence:
            graph_by_entity[evidence.entity_id].append(evidence)

        candidates: dict[str, dict] = {}
        for rank, hit in enumerate(semantic_hits, start=1):
            item = self._candidate(candidates, hit)
            item["semantic_rank"] = rank
            item["semantic_score"] = hit.score
        for hit in graph_hits:
            item = self._candidate(candidates, hit)
            entity_id = str(hit.payload.get("entity_id") or "")
            linked = graph_by_entity.get(entity_id, [])
            if linked:
                item["graph_rank"] = min(evidence.rank for evidence in linked)
                item["graph_paths"] = [evidence.path for evidence in linked]

        ordered = sorted(
            candidates.values(),
            key=lambda item: (
                -self._rrf_score(item),
                item["payload"].get("file_path", ""),
                item["payload"].get("start_line", 0),
                item["point_id"],
            ),
        )
        truncated = len(ordered) > top_k
        context_items: list[ContextItem] = []
        remaining_chars = max_context_chars
        for candidate in ordered[:top_k]:
            payload = candidate["payload"]
            source_text = str(payload.get("text", ""))
            if not source_text or remaining_chars <= 0:
                truncated = True
                continue
            content_truncated = len(source_text) > remaining_chars
            bounded_text = source_text[:remaining_chars] if content_truncated else source_text
            remaining_chars -= len(bounded_text)
            context_items.append(
                ContextItem(
                    chunk_id=candidate["point_id"],
                    repository_id=repo_id,
                    file_path=str(payload.get("file_path", "")),
                    entity_id=str(payload.get("entity_id", "")),
                    entity_name=str(payload.get("entity_name", "")),
                    entity_type=str(payload.get("entity_type", "")),
                    language=str(payload.get("language", "")),
                    start_line=int(payload.get("start_line", 1)),
                    end_line=int(payload.get("end_line", 1)),
                    text=bounded_text,
                    semantic_score=candidate.get("semantic_score"),
                    semantic_rank=candidate.get("semantic_rank"),
                    graph_rank=candidate.get("graph_rank"),
                    fusion_score=self._rrf_score(candidate),
                    fusion_rank=len(context_items) + 1,
                    graph_paths=candidate.get("graph_paths", []),
                    content_truncated=content_truncated,
                )
            )
            truncated = truncated or content_truncated

        response = HybridRetrievalResponse(
            repository_id=repo_id,
            query_id=uuid4().hex,
            items=context_items,
            graph_evidence=graph_evidence,
            truncated=truncated,
        )

        # 3. Store in warm Redis cache
        if self.cache and self.cache.enabled and cache_key:
            self.cache.set(cache_key, response)

        return response

    @staticmethod
    def _candidate(candidates: dict[str, dict], hit: VectorHit) -> dict:
        return candidates.setdefault(
            hit.point_id,
            {"point_id": hit.point_id, "payload": hit.payload, "graph_paths": []},
        )

    def _rrf_score(self, candidate: dict, constant: int | None = None) -> float:
        k = constant if constant is not None else getattr(self, "rrf_k", 60)
        sem_weight = getattr(self, "semantic_weight", 1.0)
        gr_weight = getattr(self, "graph_weight", 1.0)
        score = 0.0
        if candidate.get("semantic_rank") is not None:
            score += sem_weight / (k + candidate["semantic_rank"])
        if candidate.get("graph_rank") is not None:
            score += gr_weight / (k + candidate["graph_rank"])
        return score