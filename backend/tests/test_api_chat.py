"""
Tests for Phase 9: FastAPI Integration (POST /api/chat).

Verifies:
- Thin route orchestration delegating to RAGService.
- Validation of repository_id and query (empty, whitespace, missing, path traversal).
- Preservation of source metadata and provenance.
- Response on successful retrieval with sources.
- Response on empty retrieval / insufficient context.
- Proper HTTP error mapping on retrieval failure (503).
- Proper HTTP error mapping on LLM failure (502).
- Proper HTTP error mapping on LLM timeout (504).
- Dual prefix mounting (/api/chat and /api/v1/chat).
"""
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_rag_service
from app.core.rag.generation.base import LLMAPIError, LLMTimeoutError
from app.core.rag.retrieval.graph_retriever import GraphRetrievalError
from app.models.generation_models import (
    RAGMetadata,
    RAGResponse,
    RAGSourceItem,
)


@pytest.fixture
def mock_rag_service():
    """Create a mock RAGService for dependency injection."""
    service = MagicMock()
    return service


@pytest.fixture
def client(mock_rag_service):
    """FastAPI TestClient with overridden get_rag_service dependency."""
    app.dependency_overrides[get_rag_service] = lambda: mock_rag_service
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_chat_endpoint_success_with_sources(client, mock_rag_service):
    """Test successful POST /api/chat with sources preserving complete provenance."""
    sample_source = RAGSourceItem(
        index=1,
        repository_id="test-repo",
        file_path="src/auth/service.py",
        file_type="source_code",
        symbol="AuthService.validate_token",
        start_line=45,
        end_line=70,
        page_number=None,
        section=None,
        snippet="def validate_token(token: str) -> bool: return True",
        score=0.92,
        sources=["vector", "graph"],
        metadata={"language": "python"},
    )
    sample_metadata = RAGMetadata(
        query="How does authentication work?",
        repository_id="test-repo",
        total_sources=1,
        vector_hits=3,
        graph_hits=2,
        hybrid_fused=1,
        provider="mock",
        model="mock-rag-model",
        tokens_used=120,
        latency_seconds=0.15,
    )
    mock_rag_service.answer_query.return_value = RAGResponse(
        answer="Authentication is handled in [1] via AuthService.validate_token.",
        sources=[sample_source],
        retrieval_metadata=sample_metadata,
        is_insufficient_context=False,
        is_successful=True,
    )

    response = client.post(
        "/api/chat",
        json={
            "repository_id": "test-repo",
            "query": "How does authentication work?",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "AuthService.validate_token" in data["answer"]
    assert "sources" in data
    assert len(data["sources"]) == 1
    assert data["is_insufficient_context"] is False

    # Verify complete source provenance preservation
    source = data["sources"][0]
    assert source["index"] == 1
    assert source["repository_id"] == "test-repo"
    assert source["file_path"] == "src/auth/service.py"
    assert source["file_type"] == "source_code"
    assert source["symbol"] == "AuthService.validate_token"
    assert source["start_line"] == 45
    assert source["end_line"] == 70
    assert source["score"] == 0.92
    assert "vector" in source["sources"]
    assert "graph" in source["sources"]
    assert "validate_token" in source["snippet"]

    # Verify RAG service was called with sanitized strings
    mock_rag_service.answer_query.assert_called_once_with(
        query="How does authentication work?",
        repository_id="test-repo",
    )


def test_chat_endpoint_empty_query(client):
    """Test that empty or whitespace query returns 400 Bad Request."""
    res1 = client.post("/api/chat", json={"repository_id": "test-repo", "query": ""})
    assert res1.status_code == 400
    assert "query cannot be empty" in res1.json()["detail"].lower()

    res2 = client.post("/api/chat", json={"repository_id": "test-repo", "query": "   \n\t  "})
    assert res2.status_code == 400
    assert "query cannot be empty" in res2.json()["detail"].lower()


def test_chat_endpoint_missing_query(client):
    """Test that missing query field returns 422 Unprocessable Entity."""
    response = client.post("/api/chat", json={"repository_id": "test-repo"})
    assert response.status_code == 422


def test_chat_endpoint_empty_repository_id(client):
    """Test that empty or whitespace repository_id returns 400 Bad Request."""
    res1 = client.post("/api/chat", json={"repository_id": "", "query": "test query"})
    assert res1.status_code == 400
    assert "repository_id cannot be empty" in res1.json()["detail"].lower()

    res2 = client.post("/api/chat", json={"repository_id": "   ", "query": "test query"})
    assert res2.status_code == 400
    assert "repository_id cannot be empty" in res2.json()["detail"].lower()


def test_chat_endpoint_missing_repository_id(client):
    """Test that missing repository_id field returns 422 Unprocessable Entity."""
    response = client.post("/api/chat", json={"query": "test query"})
    assert response.status_code == 422


def test_chat_endpoint_invalid_repository_path_traversal(client):
    """Test that path traversal or invalid path repository IDs are rejected with 400."""
    res1 = client.post("/api/chat", json={"repository_id": "../etc/passwd", "query": "test query"})
    assert res1.status_code == 400
    assert "invalid repository id format" in res1.json()["detail"].lower()

    res2 = client.post("/api/chat", json={"repository_id": "/absolute/path", "query": "test query"})
    assert res2.status_code == 400
    assert "invalid repository id format" in res2.json()["detail"].lower()


def test_chat_endpoint_no_retrieval_results(client, mock_rag_service):
    """Test graceful 200 response when no relevant context was found."""
    mock_rag_service.answer_query.return_value = RAGResponse(
        answer="INSUFFICIENT CONTEXT: No relevant context found for query in repository 'test-repo'.",
        sources=[],
        retrieval_metadata=RAGMetadata(
            query="unknown symbol",
            repository_id="test-repo",
            total_sources=0,
            vector_hits=0,
            graph_hits=0,
            hybrid_fused=0,
            provider="mock",
            model="mock-rag-model",
            tokens_used=50,
            latency_seconds=0.08,
        ),
        is_insufficient_context=True,
        is_successful=True,
    )

    response = client.post(
        "/api/chat",
        json={
            "repository_id": "test-repo",
            "query": "What is the NonExistentClass?",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "INSUFFICIENT CONTEXT" in data["answer"]
    assert data["sources"] == []
    assert data["is_insufficient_context"] is True


def test_chat_endpoint_retrieval_failure_raises_503(client, mock_rag_service):
    """Test that retrieval layer exception is mapped to HTTP 503 Service Unavailable."""
    mock_rag_service.answer_query.side_effect = GraphRetrievalError("Neo4j cluster unavailable")

    response = client.post(
        "/api/chat",
        json={
            "repository_id": "test-repo",
            "query": "Tell me about payments",
        },
    )

    assert response.status_code == 503
    assert "retrieval failure" in response.json()["detail"].lower()
    assert "neo4j cluster unavailable" in response.json()["detail"].lower()


def test_chat_endpoint_retrieval_failure_via_response_raises_503(client, mock_rag_service):
    """Test that non-strict retrieval failure reported in RAGResponse returns 503."""
    mock_rag_service.answer_query.return_value = RAGResponse(
        answer="Retrieval failed",
        sources=[],
        is_successful=False,
        error="Retrieval vector index connection lost",
    )

    response = client.post(
        "/api/chat",
        json={
            "repository_id": "test-repo",
            "query": "Tell me about payments",
        },
    )

    assert response.status_code == 503
    assert "retrieval failure" in response.json()["detail"].lower()


def test_chat_endpoint_llm_failure_raises_502(client, mock_rag_service):
    """Test that LLM provider exception is mapped to HTTP 502 Bad Gateway."""
    mock_rag_service.answer_query.side_effect = LLMAPIError("OpenAI API returned HTTP 500")

    response = client.post(
        "/api/chat",
        json={
            "repository_id": "test-repo",
            "query": "How is hashing done?",
        },
    )

    assert response.status_code == 502
    assert "llm provider error" in response.json()["detail"].lower()


def test_chat_endpoint_llm_failure_via_response_raises_502(client, mock_rag_service):
    """Test that non-strict LLM failure reported in RAGResponse returns 502."""
    mock_rag_service.answer_query.return_value = RAGResponse(
        answer="Failed",
        sources=[],
        is_successful=False,
        error="Rate limit exceeded on OpenAI API",
    )

    response = client.post(
        "/api/chat",
        json={
            "repository_id": "test-repo",
            "query": "How is hashing done?",
        },
    )

    assert response.status_code == 502
    assert "llm failure" in response.json()["detail"].lower()


def test_chat_endpoint_llm_timeout_raises_504(client, mock_rag_service):
    """Test that LLM provider timeout is mapped to HTTP 504 Gateway Timeout."""
    mock_rag_service.answer_query.side_effect = LLMTimeoutError("Ollama request timed out after 30s")

    response = client.post(
        "/api/chat",
        json={
            "repository_id": "test-repo",
            "query": "Explain architecture",
        },
    )

    assert response.status_code == 504
    assert "timed out" in response.json()["detail"].lower()


def test_chat_endpoint_dual_prefix_mount(client, mock_rag_service):
    """Test that both POST /api/chat and POST /api/v1/chat route identically to RAG pipeline."""
    mock_rag_service.answer_query.return_value = RAGResponse(
        answer="Grounded answer from RAG.",
        sources=[],
        is_insufficient_context=False,
        is_successful=True,
    )

    # 1. Test POST /api/chat
    res_api = client.post("/api/chat", json={"repository_id": "repo-1", "query": "hello"})
    assert res_api.status_code == 200
    assert res_api.json()["answer"] == "Grounded answer from RAG."

    # 2. Test POST /api/v1/chat
    res_v1 = client.post("/api/v1/chat", json={"repository_id": "repo-1", "query": "hello"})
    assert res_v1.status_code == 200
    assert res_v1.json()["answer"] == "Grounded answer from RAG."
