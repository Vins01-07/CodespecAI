from fastapi.testclient import TestClient

from app.api.deps import get_graph_builder, get_hybrid_retrieval_service, get_impact_service
from app.api.routes import repos as repos_routes
from app.core.impact.service import EntityNotFoundError
from app.main import app
from app.models.impact import (
    ImpactAnalysisResponse,
    ImpactEntity,
)
from app.models.retrieval import HybridRetrievalResponse


class FakeImpactService:
    def analyze(self, **kwargs):
        if kwargs["entity_id"] == "missing":
            raise EntityNotFoundError("not present")
        return ImpactAnalysisResponse(
            repository_id="opaque-repo",
            root=ImpactEntity(id=kwargs["entity_id"], kind="function"),
            direct_dependencies=[],
            transitive_dependencies=[],
            affected_dependents=[],
            max_depth=kwargs["max_depth"],
            truncated=False,
        )


class FakeRetrievalService:
    def search(self, **kwargs):
        return HybridRetrievalResponse(
            repository_id="opaque-repo",
            query_id="query-id",
            items=[],
            graph_evidence=[],
            truncated=False,
        )


def test_impact_endpoint_returns_structured_results_and_not_found():
    app.dependency_overrides[get_impact_service] = lambda: FakeImpactService()
    client = TestClient(app)
    try:
        response = client.post(
            "/api/v1/impact/analyze",
            json={"repo_url": "repo", "entity_kind": "function", "entity_id": "src/a.py::run"},
        )
        missing = client.post(
            "/api/v1/impact/analyze",
            json={"repo_url": "repo", "entity_kind": "function", "entity_id": "missing"},
        )
    finally:
        client.close()
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["root"]["id"] == "src/a.py::run"
    assert missing.status_code == 404


def test_retrieval_and_rag_endpoints_share_grounded_contract():
    app.dependency_overrides[get_hybrid_retrieval_service] = lambda: FakeRetrievalService()
    client = TestClient(app)
    request = {"repo_url": "repo", "query": "how is a request handled?"}
    try:
        retrieval = client.post("/api/v1/retrieval/search", json=request)
        context = client.post("/api/v1/rag/context", json=request)
        invalid = client.post("/api/v1/retrieval/search", json={**request, "top_k": 51})
    finally:
        client.close()
        app.dependency_overrides.clear()

    assert retrieval.status_code == 200
    assert context.status_code == 200
    assert retrieval.json()["query_id"] == context.json()["query_id"]
    assert invalid.status_code == 422


def test_reindex_endpoint_requires_known_repo_and_schedules_task(monkeypatch, tmp_path):
    class FakeBuilder:
        def list_repositories(self):
            return [{"url": "repo-url"}]

    class FakeTask:
        id = "index-task-id"

    app.dependency_overrides[get_graph_builder] = lambda: FakeBuilder()
    monkeypatch.setattr(
        "app.api.routes.repos.resolve_repository_workspace",
        lambda repo_url, workspace: tmp_path,
    )
    monkeypatch.setattr(
        repos_routes,
        "index_repository_task",
        type("FakeIndexTask", (), {"delay": staticmethod(lambda *args: FakeTask())}),
    )
    client = TestClient(app)
    try:
        accepted = client.post("/api/v1/repos/index", json={"repo_url": "repo-url"})
        missing = client.post("/api/v1/repos/index", json={"repo_url": "other-repo"})
    finally:
        client.close()
        app.dependency_overrides.clear()

    assert accepted.status_code == 202
    assert accepted.json()["task_id"] == "index-task-id"
    assert missing.status_code == 404