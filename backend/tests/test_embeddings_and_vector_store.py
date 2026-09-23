"""
Unit test suite for CodeSpecAI RAG Phase 4: Embeddings and Vector Storage.

Validates:
1. Embedding service abstraction (single, batch, determinism, unit normalization)
2. In-memory vector store operations (upsert, search, delete, count)
3. Repository-scoped isolation (queries for repo A never leak into repo B)
4. Re-indexing without duplicate vectors
5. Neo4j vector store query building and mock session interactions
6. Error handling and missing API key safeguards
7. End-to-end IndexingService pipeline
"""
import math
from unittest.mock import MagicMock
import pytest

from app.core.rag.embeddings.mock_embedding import MockEmbeddingService
from app.core.rag.embeddings.openai_embedding import OpenAIEmbeddingService
from app.core.rag.embeddings.gemini_embedding import GeminiEmbeddingService
from app.core.rag.indexing_service import IndexingService
from app.core.rag.vector_store.in_memory_vector import InMemoryVectorStore
from app.core.rag.vector_store.neo4j_vector import Neo4jVectorStore
from app.models.classification import FileType
from app.models.chunk_models import RAGChunk


def _make_sample_chunk(
    repo_id: str,
    file_path: str,
    content: str,
    chunk_idx: int = 0,
    symbol: str | None = None,
) -> RAGChunk:
    return RAGChunk(
        chunk_id=f"{file_path}:0:{chunk_idx}",
        repository_id=repo_id,
        file_path=file_path,
        file_type=FileType.SOURCE_CODE,
        language="python",
        content=content,
        start_line=1,
        end_line=10,
        symbol=symbol or f"{file_path}::func_{chunk_idx}",
        chunk_index=chunk_idx,
        total_chunks=1,
        char_count=len(content),
        token_count=len(content) // 4,
    )


# ===========================================================================
# 1. Embedding Service Tests
# ===========================================================================

def test_mock_embedding_service_dimensions_and_normalization():
    service = MockEmbeddingService(dimensions=384)
    assert service.dimension == 384
    assert service.model_name == "mock-embedding-v1"

    vec = service.embed_text("def authenticate(): return True")
    assert len(vec) == 384

    # Verify unit-length normalization (norm ≈ 1.0)
    norm = math.sqrt(sum(x * x for x in vec))
    assert abs(norm - 1.0) < 0.01


def test_mock_embedding_determinism():
    service = MockEmbeddingService(dimensions=256)
    text = "class TokenManager: pass"

    vec1 = service.embed_text(text)
    vec2 = service.embed_text(text)
    assert vec1 == vec2


def test_mock_embedding_batch():
    service = MockEmbeddingService(dimensions=128)
    texts = ["func_one", "func_two", "func_three"]

    batch_vecs = service.embed_batch(texts)
    assert len(batch_vecs) == 3
    assert len(batch_vecs[0]) == 128
    assert batch_vecs[0] != batch_vecs[1]


def test_embed_chunk_attaches_vector():
    service = MockEmbeddingService(dimensions=128)
    chunk = _make_sample_chunk("repo1", "main.py", "print('hello')", 0)

    assert chunk.embedding is None
    service.embed_chunk(chunk)
    assert chunk.embedding is not None
    assert len(chunk.embedding) == 128


def test_api_keys_not_hardcoded_error():
    # Verify OpenAIEmbeddingService and GeminiEmbeddingService fail cleanly if no API key is provided
    with pytest.raises(ValueError, match="OPENAI_API_KEY is not configured"):
        OpenAIEmbeddingService(api_key=None)

    with pytest.raises(ValueError, match="GEMINI_API_KEY is not configured"):
        GeminiEmbeddingService(api_key=None)


# ===========================================================================
# 2. Vector Store & Repository Isolation Tests
# ===========================================================================

def test_in_memory_vector_store_crud():
    store = InMemoryVectorStore(dimensions=64)
    service = MockEmbeddingService(dimensions=64)

    c1 = _make_sample_chunk("repo_alpha", "src/auth.py", "def login(): pass", 0)
    c2 = _make_sample_chunk("repo_alpha", "src/user.py", "def get_user(): pass", 1)

    service.embed_chunks([c1, c2])

    # 1. Upsert
    stored = store.upsert_chunks([c1, c2], repository_id="repo_alpha")
    assert stored == 2
    assert store.count_chunks("repo_alpha") == 2

    # 2. Search
    query_vec = service.embed_text("def login(): pass")
    results = store.similarity_search(query_vec, repository_id="repo_alpha", top_k=2)
    assert len(results) == 2
    # The identical text chunk should have score close to 1.0
    assert results[0].chunk.chunk_id == c1.chunk_id
    assert results[0].score > 0.9

    # 3. Delete
    deleted = store.delete_repository("repo_alpha")
    assert deleted == 2
    assert store.count_chunks("repo_alpha") == 0


def test_repository_isolation_never_leaks():
    store = InMemoryVectorStore(dimensions=64)
    service = MockEmbeddingService(dimensions=64)

    # Chunks for Repo A
    chunk_a = _make_sample_chunk("repo_A", "auth.py", "secret algorithm for repo A", 0)
    # Chunks for Repo B
    chunk_b = _make_sample_chunk("repo_B", "auth.py", "secret algorithm for repo A", 0)

    service.embed_chunks([chunk_a, chunk_b])

    store.upsert_chunks([chunk_a], repository_id="repo_A")
    store.upsert_chunks([chunk_b], repository_id="repo_B")

    # Search Repo A using Repo B's text
    query_vec = service.embed_text("secret algorithm for repo A")
    results_a = store.similarity_search(query_vec, repository_id="repo_A", top_k=10)

    # Must only contain Repo A
    assert len(results_a) == 1
    assert results_a[0].chunk.repository_id == "repo_A"

    # Search Repo B
    results_b = store.similarity_search(query_vec, repository_id="repo_B", top_k=10)
    assert len(results_b) == 1
    assert results_b[0].chunk.repository_id == "repo_B"


def test_reindexing_prevents_duplicate_vectors():
    store = InMemoryVectorStore(dimensions=64)
    service = MockEmbeddingService(dimensions=64)

    chunks_v1 = [
        _make_sample_chunk("repo_reindex", "main.py", f"step_{i}", i)
        for i in range(5)
    ]
    service.embed_chunks(chunks_v1)
    store.upsert_chunks(chunks_v1, repository_id="repo_reindex")
    assert store.count_chunks("repo_reindex") == 5

    # Re-index with updated chunks
    chunks_v2 = [
        _make_sample_chunk("repo_reindex", "main.py", f"updated_step_{i}", i)
        for i in range(5)
    ]
    service.embed_chunks(chunks_v2)
    store.upsert_chunks(chunks_v2, repository_id="repo_reindex")

    # Count must remain 5, not 10!
    assert store.count_chunks("repo_reindex") == 5


# ===========================================================================
# 3. Neo4j Vector Store Mock Session Tests
# ===========================================================================

def test_neo4j_vector_store_cypher_execution():
    mock_session = MagicMock()
    mock_driver = MagicMock()
    mock_driver.session.return_value.__enter__.return_value = mock_session

    store = Neo4jVectorStore(driver=mock_driver, index_name="test_index", dimensions=128)

    # 1. Test index creation
    store.create_or_get_collection("test_index", 128)
    mock_session.run.assert_called()
    assert "CREATE VECTOR INDEX test_index IF NOT EXISTS" in mock_session.run.call_args[0][0]

    # 2. Test upsert
    service = MockEmbeddingService(dimensions=128)
    chunk = _make_sample_chunk("repo_neo", "app.py", "def run(): pass", 0)
    service.embed_chunk(chunk)

    mock_record = {"inserted": 1, "deleted": 0}
    mock_session.run.return_value.single.return_value = mock_record

    inserted = store.upsert_chunks([chunk], repository_id="repo_neo")
    assert inserted == 1

    # 3. Test delete
    mock_session.run.return_value.single.return_value = {"deleted": 1}
    deleted = store.delete_repository("repo_neo")
    assert deleted == 1


# ===========================================================================
# 4. End-to-End IndexingService Pipeline Tests
# ===========================================================================

def test_indexing_service_end_to_end():
    embedding_svc = MockEmbeddingService(dimensions=64)
    vector_store = InMemoryVectorStore(dimensions=64)

    service = IndexingService(embedding_service=embedding_svc, vector_store=vector_store)

    chunks = [
        _make_sample_chunk("repo_full", "auth.py", "def authenticate(user, password): pass", 0),
        _make_sample_chunk("repo_full", "database.py", "def connect_postgres(): pass", 1),
    ]

    # 1. Index chunks
    res = service.index_chunks(chunks, repository_id="repo_full")
    assert res.is_successful is True
    assert res.chunks_indexed == 2
    assert res.dimensions == 64

    # 2. Similarity search
    search_results = service.similarity_search("authenticate user", repository_id="repo_full", top_k=2)
    assert len(search_results) == 2
    assert search_results[0].chunk.file_path == "auth.py"

    # 3. Isolation check: Search non-existent repo returns empty list
    empty_res = service.similarity_search("authenticate", repository_id="repo_non_existent")
    assert len(empty_res) == 0

    # 4. Delete repo
    del_count = service.delete_repository("repo_full")
    assert del_count == 2
    assert service.get_stats("repo_full").repository_chunks == 0


def test_indexing_service_graceful_failure_handling():
    # Mock a vector store that raises an error
    failing_store = MagicMock()
    failing_store.upsert_chunks.side_effect = RuntimeError("Database connection refused")
    failing_store.index_name = "test_index"

    embedding_svc = MockEmbeddingService(dimensions=32)
    service = IndexingService(embedding_service=embedding_svc, vector_store=failing_store)

    chunks = [_make_sample_chunk("repo_fail", "a.py", "test", 0)]

    # Must return is_successful=False with error message, NOT raise unhandled exception
    res = service.index_chunks(chunks, repository_id="repo_fail")
    assert res.is_successful is False
    assert "Database connection refused" in res.error
