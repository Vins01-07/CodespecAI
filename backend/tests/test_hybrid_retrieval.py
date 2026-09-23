"""
Unit tests for CodeSpecAI RAG Phase 6: Hybrid Retrieval.
Tests vector-only, graph-only, hybrid fusion, repository isolation,
ranking strategies, deduplication, and backend failure resilience.
"""
from __future__ import annotations

from unittest.mock import MagicMock
import pytest

from app.core.rag.retrieval.hybrid_retriever import HybridRetriever
from app.models.chunk_models import RAGChunk
from app.models.classification import FileType
from app.models.graph_retrieval_models import GraphNodeEntity, GraphRetrievalResult
from app.models.retrieval_models import HybridRetrievalConfig, RetrievalSourceType
from app.models.vector_models import VectorSearchResult


# ===========================================================================
# Fixture Helpers
# ===========================================================================

def make_test_chunk(
    chunk_id: str = "chk_1",
    repository_id: str = "repo-1",
    file_path: str = "services/auth.py",
    symbol: str | None = "login",
    content: str = "def login(user, pwd):\n    return True",
    start_line: int = 10,
    end_line: int = 12,
) -> RAGChunk:
    return RAGChunk(
        chunk_id=chunk_id,
        repository_id=repository_id,
        file_path=file_path,
        file_type=FileType.SOURCE_CODE,
        language="python",
        content=content,
        symbol=symbol,
        start_line=start_line,
        end_line=end_line,
    )


def make_test_graph_result(
    repository_id: str = "repo-1",
    file_path: str = "services/token.py",
    symbol: str = "generate_token",
    rel: str = "CALLS",
    entity_name: str = "generate_token",
    entity_type: str = "Function",
    signature: str = "(user_id: str) -> str",
    docstring: str = "Generate JWT auth token.",
) -> GraphRetrievalResult:
    return GraphRetrievalResult(
        repository_id=repository_id,
        file_path=file_path,
        symbol=symbol,
        relationship=rel,
        direction="outgoing",
        depth=1,
        related_entity=GraphNodeEntity(
            id=f"{file_path}::{entity_name}",
            name=entity_name,
            type=entity_type,
            file_path=file_path,
            line_start=1,
            line_end=5,
            signature=signature,
            docstring=docstring,
        ),
    )


# ===========================================================================
# 1. Vector-Only Retrieval Test
# ===========================================================================

def test_vector_only_retrieval():
    """Test retrieval when only vector hits are found (no graph expansion or graph offline)."""
    mock_indexing = MagicMock()
    chunk1 = make_test_chunk("c1", "repo-1", "services/auth.py", "login")
    mock_indexing.similarity_search.return_value = [
        VectorSearchResult(chunk=chunk1, score=0.88)
    ]

    mock_graph = MagicMock()
    mock_graph.get_symbol_context.return_value = []
    mock_graph.get_file_context.return_value = []

    retriever = HybridRetriever(indexing_service=mock_indexing, graph_retriever=mock_graph)
    result = retriever.query("how does login work?", repository_id="repo-1")

    assert result.total_results == 1
    assert result.vector_hit_count == 1
    assert result.graph_hit_count == 0
    assert result.fused_hybrid_count == 0

    item = result.items[0]
    assert item.file_path == "services/auth.py"
    assert item.symbol == "login"
    assert item.provenance.sources == [RetrievalSourceType.VECTOR.value]
    assert item.provenance.vector_score == 0.88
    assert item.provenance.vector_rank == 1
    assert item.provenance.graph_score is None


# ===========================================================================
# 2. Graph-Only Retrieval Test
# ===========================================================================

def test_graph_only_retrieval():
    """Test retrieval when vector search returns no hits but query contains a graph symbol."""
    mock_indexing = MagicMock()
    mock_indexing.similarity_search.return_value = []

    mock_graph = MagicMock()
    g_res = make_test_graph_result(
        repository_id="repo-1",
        file_path="services/token.py",
        symbol="generate_token",
        rel="CALLS",
        entity_name="generate_token",
    )
    mock_graph.get_symbol_context.return_value = [g_res]
    mock_graph.get_file_context.return_value = []

    retriever = HybridRetriever(indexing_service=mock_indexing, graph_retriever=mock_graph)
    # Query mentions symbol 'generate_token' explicitly
    result = retriever.query("where is generate_token defined?", repository_id="repo-1")

    assert result.total_results == 1
    assert result.vector_hit_count == 0
    assert result.graph_hit_count == 1
    assert result.fused_hybrid_count == 0

    item = result.items[0]
    assert item.symbol == "generate_token"
    assert item.file_path == "services/token.py"
    assert item.provenance.sources == [RetrievalSourceType.GRAPH.value]
    assert item.provenance.graph_rank == 1
    assert item.provenance.graph_score is not None
    assert "generate_token" in item.content


# ===========================================================================
# 3. Overlapping Hybrid Fusion Test
# ===========================================================================

def test_overlapping_hybrid_fusion():
    """Test merging overlapping item present in both vector hits and graph expansion."""
    mock_indexing = MagicMock()
    chunk1 = make_test_chunk("c1", "repo-1", "services/auth.py", "login")
    mock_indexing.similarity_search.return_value = [
        VectorSearchResult(chunk=chunk1, score=0.95)
    ]

    mock_graph = MagicMock()
    # Graph expansion returns an entity corresponding to the same symbol
    g_res = make_test_graph_result(
        repository_id="repo-1",
        file_path="services/auth.py",
        symbol="login",
        rel="CALLED_BY",
        entity_name="login",
        entity_type="Function",
        signature="(user, pwd) -> bool",
        docstring="Doc from graph.",
    )
    mock_graph.get_symbol_context.return_value = [g_res]
    mock_graph.get_file_context.return_value = []

    retriever = HybridRetriever(indexing_service=mock_indexing, graph_retriever=mock_graph)
    result = retriever.query("validate user credentials", repository_id="repo-1")

    assert result.total_results == 1
    assert result.fused_hybrid_count == 1

    item = result.items[0]
    assert item.symbol == "login"
    assert item.file_path == "services/auth.py"
    # Merged sources
    assert set(item.provenance.sources) == {RetrievalSourceType.VECTOR.value, RetrievalSourceType.GRAPH.value}
    assert item.provenance.vector_score == 0.95
    assert item.provenance.vector_rank == 1
    assert item.provenance.graph_rank == 1
    assert "CALLED_BY" in item.provenance.graph_relationships
    # Retains full vector code content while receiving graph metadata
    assert "def login" in item.content
    assert item.metadata.get("signature") == "(user, pwd) -> bool"


# ===========================================================================
# 4. Unrelated Repository Isolation Test
# ===========================================================================

def test_unrelated_repository_isolation():
    """Verify that chunks or graph nodes from unrelated repositories are strictly filtered out."""
    mock_indexing = MagicMock()
    chunk_valid = make_test_chunk("c1", "repo-A", "auth.py", "login")
    chunk_leaked = make_test_chunk("c2", "repo-B", "secret.py", "admin_secret")
    mock_indexing.similarity_search.return_value = [
        VectorSearchResult(chunk=chunk_valid, score=0.9),
        VectorSearchResult(chunk=chunk_leaked, score=0.99),  # higher score but wrong repo!
    ]

    mock_graph = MagicMock()
    g_leaked = make_test_graph_result("repo-B", "secret.py", "admin_secret")
    mock_graph.get_symbol_context.return_value = [g_leaked]
    mock_graph.get_file_context.return_value = []

    retriever = HybridRetriever(indexing_service=mock_indexing, graph_retriever=mock_graph)
    result = retriever.query("get credentials", repository_id="repo-A")

    # repo-B data MUST NOT appear in results
    assert result.repository_id == "repo-A"
    assert result.total_results == 1
    assert result.items[0].repository_id == "repo-A"
    assert result.items[0].file_path == "auth.py"
    assert all(it.repository_id == "repo-A" for it in result.items)


# ===========================================================================
# 5. Ranking Strategies and Deduplication Test
# ===========================================================================

def test_ranking_strategies_rrf_and_weighted():
    """Test RRF and Weighted ranking strategies give expected ranking order."""
    mock_indexing = MagicMock()
    chunk1 = make_test_chunk("c1", "repo-1", "a.py", "func_a")
    chunk2 = make_test_chunk("c2", "repo-1", "b.py", "func_b")
    mock_indexing.similarity_search.return_value = [
        VectorSearchResult(chunk=chunk1, score=0.95),  # vector rank 1
        VectorSearchResult(chunk=chunk2, score=0.75),  # vector rank 2
    ]

    mock_graph = MagicMock()
    # func_b is also found in graph as a direct dependency!
    g_func_b = make_test_graph_result("repo-1", "b.py", "func_b", rel="CALLS", entity_name="func_b")
    mock_graph.get_symbol_context.return_value = [g_func_b]
    mock_graph.get_file_context.return_value = []

    # 1. RRF Ranking
    cfg_rrf = HybridRetrievalConfig(ranking_strategy="rrf", vector_weight=0.5, graph_weight=0.5, rrf_k=60)
    retriever_rrf = HybridRetriever(indexing_service=mock_indexing, graph_retriever=mock_graph)
    res_rrf = retriever_rrf.query("test query", repository_id="repo-1", config=cfg_rrf)

    # func_b is present in BOTH vector and graph, so its RRF score receives dual boost:
    # 0.5/(60+2) + 0.5/(60+1) > 0.5/(60+1)
    assert res_rrf.items[0].symbol == "func_b"
    assert res_rrf.items[1].symbol == "func_a"

    # 2. Weighted Ranking with high vector weight
    cfg_weighted = HybridRetrievalConfig(ranking_strategy="weighted", vector_weight=0.9, graph_weight=0.1)
    res_weighted = retriever_rrf.query("test query", repository_id="repo-1", config=cfg_weighted)
    # func_a has vector score 0.95 * 0.9 = 0.855
    # func_b has 0.75 * 0.9 + 1.0 * 0.1 = 0.775
    assert res_weighted.items[0].symbol == "func_a"
    assert res_weighted.items[1].symbol == "func_b"


def test_deduplication_of_identical_keys():
    """Verify that multiple chunks covering the same symbol are deduplicated."""
    mock_indexing = MagicMock()
    chunk1 = make_test_chunk("c1", "repo-1", "a.py", "same_func", content="part 1")
    chunk2 = make_test_chunk("c2", "repo-1", "a.py", "same_func", content="part 2")
    mock_indexing.similarity_search.return_value = [
        VectorSearchResult(chunk=chunk1, score=0.90),
        VectorSearchResult(chunk=chunk2, score=0.89),
    ]

    mock_graph = MagicMock()
    mock_graph.get_symbol_context.return_value = []
    mock_graph.get_file_context.return_value = []

    retriever = HybridRetriever(indexing_service=mock_indexing, graph_retriever=mock_graph)
    result = retriever.query("find function", repository_id="repo-1")

    # Should deduplicate on canonical key (file_path, symbol)
    assert result.total_results == 1
    assert result.items[0].symbol == "same_func"


# ===========================================================================
# 6. Empty Query and Failure Handling Tests
# ===========================================================================

def test_empty_query_and_empty_repo():
    """Test safe handling when query or repository_id is empty."""
    retriever = HybridRetriever()
    assert retriever.query("", repository_id="repo-1").items == []
    assert retriever.query("valid query", repository_id="").items == []
    assert retriever.query("   ", repository_id="   ").items == []


def test_vector_failure_falls_back_to_graph():
    """Verify that when vector store crashes, retriever gracefully falls back to graph search."""
    mock_indexing = MagicMock()
    mock_indexing.similarity_search.side_effect = RuntimeError("Vector DB connection dropped")

    mock_graph = MagicMock()
    g_res = make_test_graph_result("repo-1", "service.py", "OrderService", entity_name="OrderService")
    mock_graph.get_symbol_context.return_value = [g_res]
    mock_graph.get_file_context.return_value = []

    retriever = HybridRetriever(indexing_service=mock_indexing, graph_retriever=mock_graph)
    result = retriever.query("where is OrderService?", repository_id="repo-1")

    # Should not raise exception; graph retrieval succeeds
    assert result.total_results == 1
    assert result.items[0].symbol == "OrderService"
    assert result.items[0].provenance.sources == [RetrievalSourceType.GRAPH.value]


def test_graph_failure_falls_back_to_vector():
    """Verify that when Neo4j is offline, retriever gracefully returns vector results."""
    mock_indexing = MagicMock()
    chunk1 = make_test_chunk("c1", "repo-1", "auth.py", "login")
    mock_indexing.similarity_search.return_value = [
        VectorSearchResult(chunk=chunk1, score=0.92)
    ]

    mock_graph = MagicMock()
    mock_graph.get_symbol_context.side_effect = ConnectionError("Neo4j offline")
    mock_graph.get_file_context.side_effect = ConnectionError("Neo4j offline")

    retriever = HybridRetriever(indexing_service=mock_indexing, graph_retriever=mock_graph)
    result = retriever.query("user login", repository_id="repo-1")

    # Should not crash; returns vector items
    assert result.total_results == 1
    assert result.items[0].symbol == "login"
    assert result.items[0].provenance.sources == [RetrievalSourceType.VECTOR.value]


# ===========================================================================
# 7. Context String Formatting Test
# ===========================================================================

def test_to_context_string_formatting():
    """Test formatting retrieved items into structured Markdown for prompt context."""
    mock_indexing = MagicMock()
    chunk1 = make_test_chunk("c1", "repo-1", "auth.py", "validate", content="def validate(): pass", start_line=5, end_line=6)
    mock_indexing.similarity_search.return_value = [
        VectorSearchResult(chunk=chunk1, score=0.91)
    ]

    mock_graph = MagicMock()
    mock_graph.get_symbol_context.return_value = []
    mock_graph.get_file_context.return_value = []

    retriever = HybridRetriever(indexing_service=mock_indexing, graph_retriever=mock_graph)
    result = retriever.query("validate function", repository_id="repo-1")

    context_str = result.to_context_string()
    assert "# Retrieved Codebase Context for 'validate function'" in context_str
    assert "### [1] `auth.py` — Symbol: `validate` (Lines 5–6)" in context_str
    assert "def validate(): pass" in context_str
