"""
Unit tests for CodeSpecAI RAG Phase 8: Context Builder and End-to-End RAG.
Tests relevant context, empty retrieval, duplicate results removal,
context size limits, LLM failure handling, insufficient context detection,
and full provenance preservation.
"""
from __future__ import annotations

from unittest.mock import MagicMock
import pytest

from app.core.rag.generation.base import BaseLLMProvider, LLMAPIError
from app.core.rag.generation.context_builder import ContextBuilder, STRICT_RAG_SYSTEM_PROMPT
from app.core.rag.generation.providers.mock_provider import MockLLMProvider
from app.core.rag.generation.rag_service import RAGService
from app.models.generation_models import RAGResponse, RAGSourceItem
from app.models.retrieval_models import (
    RetrievalProvenance,
    RetrievalResult,
    RetrievedItem,
)


# ===========================================================================
# Fixture Helpers
# ===========================================================================

def make_item(
    id: str,
    file_path: str,
    content: str,
    symbol: str | None = None,
    start_line: int | None = 1,
    end_line: int | None = 10,
    page_number: int | None = None,
    section: str | None = None,
    score: float = 0.9,
    file_type: str = "source_code",
    sources: list[str] | None = None,
) -> RetrievedItem:
    return RetrievedItem(
        id=id,
        repository_id="repo-1",
        file_path=file_path,
        symbol=symbol,
        file_type=file_type,
        content=content,
        start_line=start_line,
        end_line=end_line,
        page_number=page_number,
        section=section,
        score=score,
        rank=1,
        provenance=RetrievalProvenance(
            sources=sources or ["vector", "graph"],
            vector_score=score,
            graph_score=1.0,
            graph_relationships=["CALLS"],
        ),
        metadata={
            "language": "python" if file_path.endswith(".py") else "markdown",
            "page_number": page_number,
            "section": section,
        },
    )


# ===========================================================================
# 1. Relevant Context and End-to-End Execution Test
# ===========================================================================

def test_end_to_end_rag_with_relevant_context():
    """Test full RAG pipeline returning grounded answer with complete provenance."""
    item1 = make_item(
        id="item-1",
        file_path="services/auth.py",
        symbol="login",
        start_line=15,
        end_line=30,
        content="def login(user, pwd):\n    return True",
        score=0.96,
        sources=["vector", "graph"],
    )
    item2 = make_item(
        id="item-2",
        file_path="docs/architecture.pdf",
        file_type="pdf",
        page_number=4,
        section="Authentication Flow",
        content="Auth service architecture overview.",
        score=0.85,
        sources=["vector"],
    )

    mock_retriever = MagicMock()
    mock_retriever.query.return_value = RetrievalResult(
        query="how does auth work?",
        repository_id="repo-1",
        items=[item1, item2],
        total_results=2,
        strategy_used="rrf",
    )

    mock_llm = MockLLMProvider(
        custom_response="Authentication is handled by login [1] according to the architecture specs [2]."
    )

    service = RAGService(
        hybrid_retriever=mock_retriever,
        context_builder=ContextBuilder(),
        llm_service=mock_llm,
    )

    response = service.answer_query("how does auth work?", repository_id="repo-1")

    assert isinstance(response, RAGResponse)
    assert response.is_successful is True
    assert response.is_insufficient_context is False
    assert "login [1]" in response.answer
    assert len(response.sources) == 2

    # Check Source 1 Provenance
    s1 = response.sources[0]
    assert s1.index == 1
    assert s1.repository_id == "repo-1"
    assert s1.file_path == "services/auth.py"
    assert s1.symbol == "login"
    assert s1.start_line == 15
    assert s1.end_line == 30
    assert s1.sources == ["vector", "graph"]

    # Check Source 2 Provenance (PDF page + section)
    s2 = response.sources[1]
    assert s2.index == 2
    assert s2.file_path == "docs/architecture.pdf"
    assert s2.file_type == "pdf"
    assert s2.page_number == 4
    assert s2.section == "Authentication Flow"

    # Check Telemetry Metadata
    assert response.retrieval_metadata is not None
    assert response.retrieval_metadata.total_sources == 2
    assert response.retrieval_metadata.provider == "mock"
    assert response.retrieval_metadata.latency_seconds >= 0.0


# ===========================================================================
# 2. Empty Retrieval Handling Test
# ===========================================================================

def test_end_to_end_rag_empty_retrieval():
    """Test RAG pipeline when no items match the query."""
    mock_retriever = MagicMock()
    mock_retriever.query.return_value = RetrievalResult(
        query="nonexistent query",
        repository_id="repo-1",
        items=[],
        total_results=0,
    )

    mock_llm = MockLLMProvider()

    service = RAGService(
        hybrid_retriever=mock_retriever,
        context_builder=ContextBuilder(),
        llm_service=mock_llm,
    )

    response = service.answer_query("nonexistent query", repository_id="repo-1")

    assert response.is_successful is True
    assert response.is_insufficient_context is True
    assert len(response.sources) == 0
    assert "No relevant codebase context was found" in response.answer


# ===========================================================================
# 3. Duplicate and Redundant Results Removal Test
# ===========================================================================

def test_context_builder_removes_duplicate_and_subsumed_results():
    """Test that duplicate contents and subsumed line ranges are removed."""
    builder = ContextBuilder()

    # 1. Master item: lines 10 to 50
    item_master = make_item("m1", "auth.py", "def full_auth(): pass", start_line=10, end_line=50, score=0.95)

    # 2. Duplicate exact content
    item_dup_content = make_item("d1", "other.py", "def full_auth(): pass", score=0.8)

    # 3. Subsumed line range: lines 15 to 25 inside auth.py
    item_subsumed = make_item("s1", "auth.py", "def helper(): pass", start_line=15, end_line=25, score=0.7)

    # 4. Independent item: lines 60 to 70 in auth.py
    item_independent = make_item("i1", "auth.py", "def logout(): pass", start_line=60, end_line=70, score=0.85)

    retrieval_res = RetrievalResult(
        query="test duplicates",
        repository_id="repo-1",
        items=[item_master, item_dup_content, item_subsumed, item_independent],
        total_results=4,
    )

    context = builder.build("test duplicates", retrieval_res)

    # Only item_master and item_independent should remain
    assert len(context.sources) == 2
    assert context.sources[0].snippet == "def full_auth(): pass"
    assert context.sources[1].snippet == "def logout(): pass"


# ===========================================================================
# 4. Context Size and Token Budget Limits Test
# ===========================================================================

def test_context_builder_respects_token_and_char_limits():
    """Test truncation of low-ranked items when exceeding max context limits."""
    # 300 chars budget
    builder = ContextBuilder(max_context_chars=300)

    item1 = make_item("i1", "a.py", "A" * 150)
    item2 = make_item("i2", "b.py", "B" * 150)
    item3 = make_item("i3", "c.py", "C" * 150)

    retrieval_res = RetrievalResult(
        query="query",
        repository_id="repo-1",
        items=[item1, item2, item3],
        total_results=3,
    )

    context = builder.build("query", retrieval_res)

    # Item 1 and Item 2 might fill the budget; Item 3 should be truncated
    assert len(context.sources) < 3
    assert len(context.sources) >= 1
    assert "a.py" in context.user_prompt


# ===========================================================================
# 5. LLM Failure Handling Test
# ===========================================================================

def test_rag_service_llm_failure_non_strict():
    """Test that LLM provider failure returns a failed RAGResponse when strict=False."""
    mock_retriever = MagicMock()
    mock_retriever.query.return_value = RetrievalResult(
        query="q",
        repository_id="repo-1",
        items=[make_item("i1", "a.py", "code")],
    )

    mock_llm = MagicMock(spec=BaseLLMProvider)
    mock_llm.provider_name = "mock_failing"
    mock_llm.model_name = "fail_v1"
    mock_llm.generate.side_effect = LLMAPIError("API connection timeout")

    service = RAGService(
        hybrid_retriever=mock_retriever,
        llm_service=mock_llm,
        strict=False,
    )

    response = service.answer_query("q", repository_id="repo-1")

    assert response.is_successful is False
    assert "Unable to generate response" in response.answer
    assert "API connection timeout" in response.error
    assert len(response.sources) == 1


def test_rag_service_llm_failure_strict():
    """Test that LLM provider failure raises exception when strict=True."""
    mock_retriever = MagicMock()
    mock_retriever.query.return_value = RetrievalResult(query="q", repository_id="repo-1", items=[])

    mock_llm = MagicMock(spec=BaseLLMProvider)
    mock_llm.generate.side_effect = LLMAPIError("Server Down")

    service = RAGService(
        hybrid_retriever=mock_retriever,
        llm_service=mock_llm,
        strict=True,
    )

    with pytest.raises(LLMAPIError):
        service.answer_query("q", repository_id="repo-1")


# ===========================================================================
# 6. Insufficient Context Detection Test
# ===========================================================================

def test_rag_service_detects_insufficient_context_from_llm():
    """Test is_insufficient_context is flagged when LLM states context is insufficient."""
    mock_retriever = MagicMock()
    # Retrieval returned some tangentially related item
    mock_retriever.query.return_value = RetrievalResult(
        query="what is the database password?",
        repository_id="repo-1",
        items=[make_item("i1", "db.py", "db_host = 'localhost'")],
    )

    # LLM explicitly follows prompt directive to state insufficient context
    mock_llm = MockLLMProvider(
        custom_response="INSUFFICIENT CONTEXT: The provided repository context does not contain the database password."
    )

    service = RAGService(
        hybrid_retriever=mock_retriever,
        llm_service=mock_llm,
    )

    response = service.answer_query("what is the database password?", repository_id="repo-1")

    assert response.is_successful is True
    assert response.is_insufficient_context is True
    assert "INSUFFICIENT CONTEXT" in response.answer


# ===========================================================================
# 7. Grounding Prompt Directives Test
# ===========================================================================

def test_context_builder_grounding_system_prompt():
    """Verify system prompt contains strict anti-hallucination and citation rules."""
    builder = ContextBuilder()
    prompt = builder.system_prompt

    assert "Do NOT invent" in prompt or "strictly" in prompt
    assert "INSUFFICIENT CONTEXT" in prompt
    assert "[1]" in prompt
