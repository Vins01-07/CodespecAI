from contextlib import contextmanager

from app.core.retrieval.graph import Neo4jGraphRetriever
from app.core.retrieval.service import HybridRetrievalService
from app.core.repository_identity import repository_id
from app.core.vectors.store import VectorHit


class FakeEmbedding:
    def embed_texts(self, texts):
        return [[1.0, 0.0] for _ in texts]


class FakeVectorStore:
    def __init__(self):
        self.search_args = None
        self.entity_args = None
        self.semantic = [
            VectorHit(
                "chunk-semantic",
                0.91,
                {
                    "repository_id": "repo",
                    "file_path": "src/a.py",
                    "entity_id": "src/a.py::start",
                    "entity_name": "start",
                    "entity_type": "function",
                    "language": "python",
                    "start_line": 1,
                    "end_line": 3,
                    "text": "def start(): pass",
                },
            )
        ]
        self.related = [
            VectorHit(
                "chunk-graph",
                0,
                {
                    "repository_id": "repo",
                    "file_path": "src/b.py",
                    "entity_id": "src/b.py::called",
                    "entity_name": "called",
                    "entity_type": "function",
                    "language": "python",
                    "start_line": 5,
                    "end_line": 7,
                    "text": "def called(): pass",
                },
            )
        ]

    def search(self, repository_key, vector, top_k, score_threshold):
        self.search_args = (repository_key, vector, top_k)
        return self.semantic

    def get_chunks_for_entities(self, repository_key, entity_ids, limit):
        self.entity_args = (repository_key, entity_ids)
        return self.related


class FakeSession:
    def __init__(self):
        self.queries = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def run(self, query, **kwargs):
        self.queries.append((query, kwargs))
        if kwargs["source_ids"] == ["src/a.py::start"]:
            return [
                {
                    "source_id": "src/a.py::start",
                    "entity_id": "src/b.py::called",
                    "entity_kind": "Function",
                    "entity_name": "called",
                    "file_path": "src/b.py",
                    "line_start": 5,
                    "line_end": 7,
                    "relationship": "CALLS",
                    "direction": "outgoing",
                }
            ]
        return []


def test_hybrid_fusion_keeps_semantic_and_graph_evidence_separate():
    vector_store = FakeVectorStore()
    session = FakeSession()
    graph = Neo4jGraphRetriever(lambda: session)
    service = HybridRetrievalService(FakeEmbedding(), vector_store, graph)

    result = service.search("repo-url", "find call", top_k=4, graph_depth=1)

    assert vector_store.search_args[0] == repository_id("repo-url")
    assert vector_store.entity_args[0] == repository_id("repo-url")
    assert {item.chunk_id for item in result.items} == {"chunk-semantic", "chunk-graph"}
    graph_item = next(item for item in result.items if item.chunk_id == "chunk-graph")
    assert graph_item.graph_paths[0].relationships == ["CALLS"]
    assert graph_item.semantic_score is None
    assert graph_item.fusion_score > 0
    assert result.graph_evidence[0].path.directions == ["outgoing"]
    assert all(call[1]["repo_url"] == "repo-url" for call in session.queries)


def test_graph_retriever_expands_in_bounded_repository_scoped_levels():
    session = FakeSession()
    evidence = Neo4jGraphRetriever(lambda: session).expand(
        "repo-url", ["src/a.py::start"], depth=1, limit=10
    )

    assert [item.entity_id for item in evidence] == ["src/b.py::called"]
    assert session.queries[0][1]["relationship_types"]
    assert "neighbor.repo_url = $repo_url" in session.queries[0][0]
    assert "LIMIT $limit" in session.queries[0][0]


def test_semantic_only_evidence_works_without_graph_neighbors():
    class EmptyGraph:
        def expand(self, *args, **kwargs):
            return []

    result = HybridRetrievalService(
        FakeEmbedding(), FakeVectorStore(), EmptyGraph()
    ).search("repo-url", "meaning", top_k=1, graph_depth=0, max_context_chars=100)

    assert len(result.items) == 1
    assert result.items[0].semantic_rank == 1
    assert result.items[0].graph_paths == []