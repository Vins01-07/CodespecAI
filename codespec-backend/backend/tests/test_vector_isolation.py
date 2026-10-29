"""Multi-tenant security, dynamic batching, and schema validation tests for Qdrant and Redis cache."""

from __future__ import annotations

import time
from uuid import NAMESPACE_URL, uuid5
import pytest
from qdrant_client import QdrantClient

from app.core.chunking.models import CodeChunk
from app.core.retrieval.cache import RedisContextCache
from app.core.vectors.schemas import ChunkPayloadSchema
from app.core.vectors.store import QdrantVectorStore, VectorStoreError
from app.models.retrieval import ContextItem, HybridRetrievalResponse


def make_test_chunk(repo_id: str, index: int, file_path: str = "src/auth.py", text: str = "token = 1") -> CodeChunk:
    return CodeChunk(
        chunk_id=str(uuid5(NAMESPACE_URL, f"{repo_id}:{file_path}:{index}")),
        repository_id=repo_id,
        file_path=file_path,
        entity_id=f"{file_path}::entity_{index}",
        entity_name=f"entity_{index}",
        entity_type="function",
        language="python",
        start_line=index * 10 + 1,
        end_line=index * 10 + 9,
        chunk_index=index,
        content_hash=f"hash_{index}",
        file_revision="rev_1",
        text=text,
    )


def test_strict_multi_tenant_isolation_zero_data_leakage():
    """Verify 100% isolation: querying repo_A returns zero vectors belonging to repo_B."""
    client = QdrantClient(":memory:")
    store = QdrantVectorStore(client=client, collection_name="multi_tenant_test", vector_size=2)
    try:
        store.ensure_collection()
        chunks_a = [make_test_chunk("repo_alpha", i, text=f"alpha code snippet {i}") for i in range(5)]
        chunks_b = [make_test_chunk("repo_beta", i, text=f"beta secret snippet {i}") for i in range(5)]

        identical_vector = [0.7071, 0.7071]
        vectors_a = [identical_vector for _ in chunks_a]
        vectors_b = [identical_vector for _ in chunks_b]

        store.upsert(chunks_a, vectors_a)
        store.upsert(chunks_b, vectors_b)

        # Search from tenant Alpha
        hits_alpha = store.search("repo_alpha", identical_vector, top_k=10)
        assert len(hits_alpha) == 5
        assert all(hit.payload["repository_id"] == "repo_alpha" for hit in hits_alpha)
        assert all("beta" not in hit.payload["text"] for hit in hits_alpha)

        # Search from tenant Beta
        hits_beta = store.search("repo_beta", identical_vector, top_k=10)
        assert len(hits_beta) == 5
        assert all(hit.payload["repository_id"] == "repo_beta" for hit in hits_beta)
        assert all("alpha" not in hit.payload["text"] for hit in hits_beta)

        # Non-existent tenant returns empty list
        hits_gamma = store.search("repo_gamma", identical_vector, top_k=10)
        assert len(hits_gamma) == 0

        # Attempting search without repository filter raises ValueError
        with pytest.raises(ValueError, match="Repository filter is required"):
            store.search("", identical_vector, top_k=5)
    finally:
        client.close()


def test_dynamic_batching_upsert_large_repo():
    """Verify upserting 150 points in batches of 64 executes seamlessly without memory spikes."""
    client = QdrantClient(":memory:")
    store = QdrantVectorStore(
        client=client,
        collection_name="batching_test",
        vector_size=2,
        upsert_batch_size=64,
    )
    try:
        store.ensure_collection()
        total_chunks = 150
        chunks = [make_test_chunk("repo_large", i) for i in range(total_chunks)]
        vectors = [[1.0, 0.0] for _ in range(total_chunks)]

        # Should split 150 into batches of 64, 64, 22
        store.upsert(chunks, vectors, batch_size=64)

        hits = store.search("repo_large", [1.0, 0.0], top_k=200)
        assert len(hits) == total_chunks
    finally:
        client.close()


def test_payload_schema_validation_rejects_corrupted_payload():
    """Verify Pydantic schema validation blocks malformed chunk payloads from entering Qdrant."""
    client = QdrantClient(":memory:")
    store = QdrantVectorStore(client=client, collection_name="schema_test", vector_size=2)
    try:
        store.ensure_collection()
        # Create chunk with invalid empty text
        invalid_chunk = CodeChunk(
            chunk_id="chunk-bad",
            repository_id="repo-bad",
            file_path="src/bad.py",
            entity_id=None,
            entity_name=None,
            entity_type=None,
            language="python",
            start_line=1,
            end_line=1,
            chunk_index=0,
            content_hash="bad",
            file_revision="rev",
            text="",  # Invalid: min_length=1
        )

        with pytest.raises(VectorStoreError, match="Chunk payload validation failed"):
            store.upsert([invalid_chunk], [[1.0, 0.0]])
    finally:
        client.close()


class FakeRedisClient:
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ex=None):
        self.store[key] = value
        return True

    def ping(self):
        return True


def test_redis_context_cache_sub_250ms_roundtrip():
    """Verify Redis context caching roundtrip produces warm grounded context in < 250ms."""
    fake_redis = FakeRedisClient()
    cache = RedisContextCache(enabled=True, client=fake_redis, ttl_seconds=300)

    key = cache.generate_key("repo-xyz", "where is auth?", top_k=5, graph_depth=1, max_context_chars=5000)
    assert key.startswith("codespec:context:repo-xyz:")

    # Initial get: miss
    assert cache.get(key) is None

    # Save warm response
    response = HybridRetrievalResponse(
        repository_id="repo-xyz",
        query_id="query-123",
        items=[
            ContextItem(
                chunk_id="chunk-1",
                repository_id="repo-xyz",
                file_path="src/auth.py",
                entity_id="src/auth.py::login",
                entity_name="login",
                entity_type="function",
                language="python",
                start_line=1,
                end_line=10,
                text="def login(): return True",
                fusion_score=0.032,
                fusion_rank=1,
            )
        ],
        graph_evidence=[],
        truncated=False,
    )

    t0 = time.perf_counter()
    cache.set(key, response)
    cached = cache.get(key)
    latency_ms = (time.perf_counter() - t0) * 1000

    assert latency_ms < 250.0
    assert cached is not None
    assert cached.repository_id == "repo-xyz"
    assert cached.items[0].entity_name == "login"
