"""
Unit and integration tests for CodeSpecAI RAG Phase 5: Graph-aware Retrieval.
"""
from __future__ import annotations

from unittest.mock import MagicMock
import pytest
from neo4j.exceptions import Neo4jError, ServiceUnavailable

from app.core.rag.retrieval.graph_retriever import (
    GraphConnectionError,
    GraphRetrievalError,
    GraphRetriever,
)
from app.models.chunk_models import RAGChunk
from app.models.classification import FileType
from app.models.graph_retrieval_models import (
    GraphContextSummary,
    GraphNodeEntity,
    GraphRelationshipType,
    GraphRetrievalResult,
)


# ===========================================================================
# Mock Helpers
# ===========================================================================

class MockNode:
    """Mock Neo4j Node supporting dict access, labels, and items()."""
    def __init__(self, labels: list[str], props: dict):
        self.labels = set(labels)
        self._props = props

    def __getitem__(self, key):
        return self._props[key]

    def get(self, key, default=None):
        return self._props.get(key, default)

    def items(self):
        return self._props.items()

    def keys(self):
        return self._props.keys()

    def values(self):
        return self._props.values()


def make_mock_session(records: list[dict]):
    """Create a mock session returning a sequence of dict-like records."""
    mock_session = MagicMock()
    mock_session.run.return_value = records
    mock_session.__enter__.return_value = mock_session
    mock_session.__exit__.return_value = False
    return mock_session


# ===========================================================================
# 1. Symbol Context Retrieval Tests
# ===========================================================================

def test_get_symbol_context_outgoing_calls():
    """Test retrieving outgoing CALLS from a function symbol."""
    caller_node = MockNode(
        ["Function"],
        {
            "id": "services/auth.py::login",
            "name": "login",
            "file_path": "services/auth.py",
            "line_start": 10,
            "line_end": 20,
            "parameters": ["username", "password"],
            "return_type": "bool",
            "docstring": "Authenticate user.",
        },
    )
    callee_node = MockNode(
        ["Function"],
        {
            "id": "services/token.py::generate_token",
            "name": "generate_token",
            "file_path": "services/token.py",
            "line_start": 5,
            "line_end": 12,
            "parameters": ["user_id"],
            "return_type": "str",
            "docstring": "Generate JWT token.",
        },
    )

    records = [
        {"src": caller_node, "rel_type": "CALLS", "tgt": callee_node, "direction": "outgoing"}
    ]

    mock_session = make_mock_session(records)
    retriever = GraphRetriever(session_factory=lambda: mock_session)

    results = retriever.get_symbol_context("login", repository_id="https://github.com/org/repo")

    assert len(results) == 1
    r = results[0]
    assert r.repository_id == "https://github.com/org/repo"
    assert r.symbol == "login"
    assert r.file_path == "services/auth.py"
    assert r.relationship == "CALLS"
    assert r.direction == "outgoing"
    assert r.related_entity.id == "services/token.py::generate_token"
    assert r.related_entity.name == "generate_token"
    assert r.related_entity.type == "Function"
    assert r.related_entity.file_path == "services/token.py"
    assert r.related_entity.signature == "(user_id) -> str"


def test_get_symbol_context_incoming_callers():
    """Test retrieving incoming calls normalized to CALLED_BY."""
    callee_node = MockNode(
        ["Function"],
        {
            "id": "services/token.py::generate_token",
            "name": "generate_token",
            "file_path": "services/token.py",
        },
    )
    caller_node = MockNode(
        ["Function"],
        {
            "id": "services/auth.py::login",
            "name": "login",
            "file_path": "services/auth.py",
        },
    )

    records = [
        {"src": callee_node, "rel_type": "CALLS", "tgt": caller_node, "direction": "incoming"}
    ]

    mock_session = make_mock_session(records)
    retriever = GraphRetriever(session_factory=lambda: mock_session)

    results = retriever.get_symbol_context("generate_token", repository_id="repo-1")

    assert len(results) == 1
    r = results[0]
    assert r.relationship == "CALLED_BY"
    assert r.direction == "incoming"
    assert r.related_entity.name == "login"
    assert r.related_entity.file_path == "services/auth.py"


def test_get_symbol_context_dependencies():
    """Test retrieving INSTANTIATES, USES, and EXTENDS relationships."""
    cls_node = MockNode(
        ["Class"],
        {
            "id": "services/auth.py::AuthService",
            "name": "AuthService",
            "file_path": "services/auth.py",
            "line_start": 1,
            "line_end": 50,
        },
    )
    base_node = MockNode(
        ["Class"],
        {
            "id": "services/base.py::BaseService",
            "name": "BaseService",
            "file_path": "services/base.py",
        },
    )

    records = [
        {"src": cls_node, "rel_type": "EXTENDS", "tgt": base_node, "direction": "outgoing"}
    ]

    mock_session = make_mock_session(records)
    retriever = GraphRetriever(session_factory=lambda: mock_session)

    results = retriever.get_symbol_context("AuthService", repository_id="repo-1")

    assert len(results) == 1
    assert results[0].relationship == "EXTENDS"
    assert results[0].related_entity.name == "BaseService"


def test_get_symbol_context_with_filter():
    """Test filtering results by relationship_types."""
    fn_node = MockNode(["Function"], {"id": "f1", "name": "f1"})
    target_call = MockNode(["Function"], {"id": "f2", "name": "f2"})
    target_uses = MockNode(["Class"], {"id": "c1", "name": "C1"})

    records = [
        {"src": fn_node, "rel_type": "CALLS", "tgt": target_call, "direction": "outgoing"},
        {"src": fn_node, "rel_type": "USES", "tgt": target_uses, "direction": "outgoing"},
    ]

    mock_session = make_mock_session(records)
    retriever = GraphRetriever(session_factory=lambda: mock_session)

    results = retriever.get_symbol_context(
        "f1",
        repository_id="repo-1",
        relationship_types=["CALLS"],
    )

    assert len(results) == 1
    assert results[0].relationship == "CALLS"


# ===========================================================================
# 2. File Context Retrieval Tests
# ===========================================================================

def test_get_file_context_definitions_and_imports():
    """Test retrieving defined items and file imports."""
    file_node = MockNode(["File"], {"path": "services/auth.py", "language": "python"})
    cls_node = MockNode(["Class"], {"id": "services/auth.py::AuthService", "name": "AuthService", "path": "services/auth.py"})
    fn_node = MockNode(["Function"], {"id": "services/auth.py::helper", "name": "helper", "path": "services/auth.py"})
    imported_file = MockNode(["File"], {"path": "core/security.py", "language": "python"})
    importer_file = MockNode(["File"], {"path": "main.py", "language": "python"})

    def mock_run(query, params):
        if "-[:DEFINES]->" in query:
            return [
                {"f": file_node, "item": cls_node, "item_type": "Class"},
                {"f": file_node, "item": fn_node, "item_type": "Function"},
            ]
        elif "-[:IMPORTS]->(tgt:File)" in query:
            return [{"f": file_node, "tgt": imported_file}]
        elif "-[:IMPORTS]->(f:File" in query:
            return [{"src": importer_file, "f": file_node}]
        return []

    mock_session = MagicMock()
    mock_session.run.side_effect = mock_run
    mock_session.__enter__.return_value = mock_session
    mock_session.__exit__.return_value = False

    retriever = GraphRetriever(session_factory=lambda: mock_session)

    results = retriever.get_file_context(
        file_path="services/auth.py",
        repository_id="repo-1",
    )

    assert len(results) == 4
    relationships = {r.relationship for r in results}
    assert GraphRelationshipType.DEFINES.value in relationships
    assert GraphRelationshipType.IMPORTS.value in relationships
    assert GraphRelationshipType.IMPORTED_BY.value in relationships

    imported = next(r for r in results if r.relationship == "IMPORTS")
    assert imported.related_entity.id == "core/security.py"

    importers = next(r for r in results if r.relationship == "IMPORTED_BY")
    assert importers.related_entity.id == "main.py"


def test_get_file_context_path_normalization():
    """Test that Windows path separators are normalized in queries."""
    recorded_params = []

    def mock_run(query, params):
        recorded_params.append(params)
        return []

    mock_session = MagicMock()
    mock_session.run.side_effect = mock_run
    mock_session.__enter__.return_value = mock_session
    mock_session.__exit__.return_value = False

    retriever = GraphRetriever(session_factory=lambda: mock_session)
    retriever.get_file_context("services\\auth\\login.py", repository_id="repo-1")

    assert len(recorded_params) > 0
    assert recorded_params[0]["path"] == "services/auth/login.py"


# ===========================================================================
# 3. Chunk Context Retrieval Tests
# ===========================================================================

def test_get_chunk_context_resolves_symbol():
    """Test that chunk context retrieves symbol context when chunk has a symbol."""
    chunk = RAGChunk(
        chunk_id="chk_1",
        repository_id="repo-1",
        file_path="services/auth.py",
        file_type=FileType.SOURCE_CODE,
        language="python",
        content="def login(): pass",
        symbol="login",
        start_line=1,
        end_line=2,
    )

    fn_node = MockNode(["Function"], {"id": "services/auth.py::login", "name": "login"})
    called_node = MockNode(["Function"], {"id": "services/db.py::query", "name": "query"})

    mock_session = make_mock_session([
        {"src": fn_node, "rel_type": "CALLS", "tgt": called_node, "direction": "outgoing"}
    ])
    retriever = GraphRetriever(session_factory=lambda: mock_session)

    results = retriever.get_chunk_context(chunk)
    assert len(results) == 1
    assert results[0].symbol == "login"
    assert results[0].relationship == "CALLS"


def test_get_chunk_context_fallback_to_file():
    """Test that chunk without symbol falls back to file context."""
    chunk = RAGChunk(
        chunk_id="chk_2",
        repository_id="repo-1",
        file_path="docs/guide.md",
        file_type=FileType.MARKDOWN,
        language="markdown",
        content="# Guide",
    )

    imported_node = MockNode(["File"], {"path": "docs/architecture.md"})

    def mock_run(query, params):
        if "-[:IMPORTS]->(tgt:File)" in query:
            return [{"f": MockNode(["File"], {"path": "docs/guide.md"}), "tgt": imported_node}]
        return []

    mock_session = MagicMock()
    mock_session.run.side_effect = mock_run
    mock_session.__enter__.return_value = mock_session
    mock_session.__exit__.return_value = False

    retriever = GraphRetriever(session_factory=lambda: mock_session)

    results = retriever.get_chunk_context(chunk)
    assert len(results) == 1
    assert results[0].relationship == "IMPORTS"
    assert results[0].related_entity.id == "docs/architecture.md"


# ===========================================================================
# 4. Batch and Path Discovery Tests
# ===========================================================================

def test_get_batch_context_deduplication():
    """Test batch context retrieval across multiple symbols with deduplication."""
    src1 = MockNode(["Function"], {"id": "f1", "name": "f1"})
    tgt1 = MockNode(["Function"], {"id": "f2", "name": "f2"})

    records = [
        {"src": src1, "rel_type": "CALLS", "tgt": tgt1, "direction": "outgoing"}
    ]
    mock_session = make_mock_session(records)
    retriever = GraphRetriever(session_factory=lambda: mock_session)

    # Calling with duplicate symbols should deduplicate
    results = retriever.get_batch_context(
        symbols=["f1", "f1"],
        repository_id="repo-1",
    )

    assert len(results) == 1


def test_find_path_between_symbols():
    """Test discovering a path between two functions."""
    n1 = MockNode(["Function"], {"id": "f1", "name": "f1", "file_path": "a.py"})
    n2 = MockNode(["Function"], {"id": "f2", "name": "f2", "file_path": "b.py"})
    n3 = MockNode(["Function"], {"id": "f3", "name": "f3", "file_path": "c.py"})

    mock_record = {
        "path_nodes": [n1, n2, n3],
        "path_rels": ["CALLS", "CALLS"],
    }
    mock_session = make_mock_session([mock_record])
    retriever = GraphRetriever(session_factory=lambda: mock_session)

    path = retriever.find_path_between_symbols(
        source_symbol="f1",
        target_symbol="f3",
        repository_id="repo-1",
    )

    assert len(path) == 2
    assert path[0].symbol == "f1"
    assert path[0].related_entity.name == "f2"
    assert path[0].relationship == "CALLS"
    assert path[1].symbol == "f2"
    assert path[1].related_entity.name == "f3"


# ===========================================================================
# 5. GraphContextSummary Tests
# ===========================================================================

def test_graph_context_summary_helpers_and_formatting():
    """Test helper accessors and markdown formatting in GraphContextSummary."""
    ent1 = GraphNodeEntity(id="b.py::bar", name="bar", type="Function", file_path="b.py", line_start=15)
    ent2 = GraphNodeEntity(id="c.py::Baz", name="Baz", type="Class", file_path="c.py", line_start=5)

    res1 = GraphRetrievalResult(
        repository_id="repo-1",
        symbol="foo",
        relationship="CALLS",
        direction="outgoing",
        related_entity=ent1,
    )
    res2 = GraphRetrievalResult(
        repository_id="repo-1",
        symbol="foo",
        relationship="USES",
        direction="outgoing",
        related_entity=ent2,
    )

    summary = GraphContextSummary(
        repository_id="repo-1",
        focal_symbol="foo",
        results=[res1, res2],
    )

    assert len(summary.get_calls()) == 1
    assert summary.get_calls()[0].related_entity.name == "bar"

    assert len(summary.get_dependencies()) == 1
    assert summary.get_dependencies()[0].related_entity.name == "Baz"

    text = summary.to_text_summary()
    assert "### Code Graph Context: foo" in text
    assert "**CALLS**" in text
    assert "`bar` (Function) in `b.py`:15" in text
    assert "**USES**" in text
    assert "`Baz` (Class) in `c.py`:5" in text


# ===========================================================================
# 6. Error Handling & Edge Cases
# ===========================================================================

def test_neo4j_service_unavailable_handled_gracefully():
    """Test that Neo4j ServiceUnavailable returns empty list in non-strict mode."""
    mock_session = MagicMock()
    mock_session.run.side_effect = ServiceUnavailable("Cannot reach Neo4j")
    mock_session.__enter__.return_value = mock_session
    mock_session.__exit__.return_value = False

    retriever = GraphRetriever(session_factory=lambda: mock_session, strict=False)
    results = retriever.get_symbol_context("my_func", repository_id="repo-1")

    assert results == []


def test_neo4j_service_unavailable_raises_in_strict_mode():
    """Test that Neo4j ServiceUnavailable raises GraphConnectionError in strict mode."""
    mock_session = MagicMock()
    mock_session.run.side_effect = ServiceUnavailable("Cannot reach Neo4j")
    mock_session.__enter__.return_value = mock_session
    mock_session.__exit__.return_value = False

    retriever = GraphRetriever(session_factory=lambda: mock_session, strict=True)
    with pytest.raises(GraphConnectionError):
        retriever.get_symbol_context("my_func", repository_id="repo-1")


def test_neo4j_query_error_raises_in_strict_mode():
    """Test that Neo4jError raises GraphRetrievalError in strict mode."""
    mock_session = MagicMock()
    mock_session.run.side_effect = Neo4jError("Syntax error in cypher")
    mock_session.__enter__.return_value = mock_session
    mock_session.__exit__.return_value = False

    retriever = GraphRetriever(session_factory=lambda: mock_session, strict=True)
    with pytest.raises(GraphRetrievalError):
        retriever.get_symbol_context("my_func", repository_id="repo-1")


def test_empty_query_inputs_return_empty_list():
    """Test empty symbol, file_path, or repository_id inputs."""
    retriever = GraphRetriever()
    assert retriever.get_symbol_context("", repository_id="repo-1") == []
    assert retriever.get_symbol_context("sym", repository_id="") == []
    assert retriever.get_file_context("", repository_id="repo-1") == []
    assert retriever.get_file_context("file.py", repository_id="") == []
    assert retriever.find_path_between_symbols("", "target", "repo-1") == []


# ===========================================================================
# 7. Integration Test (Runs only if live Neo4j is reachable)
# ===========================================================================

def is_live_neo4j_available() -> bool:
    """Check if a live Neo4j server is currently accessible."""
    try:
        from app.db.neo4j import get_driver
        driver = get_driver()
        driver.verify_connectivity()
        return True
    except Exception:
        return False


@pytest.mark.skipif(not is_live_neo4j_available(), reason="Live Neo4j instance not reachable")
def test_live_neo4j_integration():
    """Integration test against a live Neo4j instance (skipped if offline)."""
    retriever = GraphRetriever()
    results = retriever.get_symbol_context("non_existent_symbol_12345", repository_id="test-repo")
    assert isinstance(results, list)
