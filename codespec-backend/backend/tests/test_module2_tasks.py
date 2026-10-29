from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest

from app.core.embeddings.service import EmbeddingError
from app.core.indexing.lock import RedisRepositoryLock, RepositoryLockBusy
from app.core.vectors.store import VectorStoreError
from app.workers import tasks
from app.workers.celery_app import celery_app


def test_graph_ingestion_enqueues_separate_index_task(monkeypatch, tmp_path: Path):
    dummy_file = tmp_path / "app.py"
    dummy_file.write_text("print('test')")
    monkeypatch.setattr(tasks._scanner, "scan", lambda root: [dummy_file])
    monkeypatch.setattr(
        tasks._registry,
        "parse_files",
        lambda paths, base_dir: [SimpleNamespace(path="app.py", language="python", functions=[], classes=[], imports=[])],
    )
    monkeypatch.setattr(
        tasks._builder,
        "ingest_full_repo",
        lambda *args: {"files": 1, "functions": 0, "classes": 0},
    )
    enqueued = []
    monkeypatch.setattr(
        tasks.index_repository_task,
        "delay",
        lambda *args: (enqueued.append(args) or SimpleNamespace(id="index-id")),
    )

    result = tasks._run_pipeline(tmp_path, "repo-url", "repo-name")

    assert result["semantic_index_task_id"] == "index-id"
    assert enqueued == [(str(tmp_path), "repo-url")]


def test_graph_ingestion_rejects_empty_repository(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(tasks._scanner, "scan", lambda root: [])
    with pytest.raises(ValueError, match="No supported source files found"):
        tasks._run_pipeline(tmp_path, "repo-url", "repo-name", branch="main")


def test_graph_ingestion_rejects_unparseable_repository(monkeypatch, tmp_path: Path):
    dummy_file = tmp_path / "corrupt.py"
    dummy_file.write_text("...")
    monkeypatch.setattr(tasks._scanner, "scan", lambda root: [dummy_file])
    monkeypatch.setattr(tasks._registry, "parse_files", lambda paths, base_dir: [])
    with pytest.raises(ValueError, match="Failed to parse any source files"):
        tasks._run_pipeline(tmp_path, "repo-url", "repo-name", branch="main")


def test_celery_routes_indexing_to_dedicated_queue():
    assert celery_app.conf.task_routes["codespec.index_repository"]["queue"] == "embeddings"


def test_only_transient_index_errors_are_retried():
    network_error = httpx.ConnectError("qdrant unavailable")
    wrapped_network_error = VectorStoreError("qdrant unavailable")
    wrapped_network_error.__cause__ = network_error

    assert tasks._is_retryable_index_error(network_error)
    assert tasks._is_retryable_index_error(wrapped_network_error)
    assert not tasks._is_retryable_index_error(EmbeddingError("model unavailable"))
    assert not tasks._is_retryable_index_error(ValueError("bad configuration"))


def test_repository_lock_releases_and_reports_contention():
    class FakeLock:
        def __init__(self, acquired):
            self.acquired = acquired
            self.released = False

        def acquire(self, **kwargs):
            return self.acquired

        def release(self):
            self.released = True

    class FakeRedis:
        def __init__(self, acquired):
            self.lock_instance = FakeLock(acquired)
            self.lock_args = None

        def lock(self, *args, **kwargs):
            self.lock_args = (args, kwargs)
            return self.lock_instance

    redis_client = FakeRedis(acquired=True)
    with RedisRepositoryLock(redis_client)("opaque-repo"):
        pass
    assert redis_client.lock_args[0] == ("codespec:index:opaque-repo",)
    assert redis_client.lock_instance.released

    with pytest.raises(RepositoryLockBusy):
        with RedisRepositoryLock(FakeRedis(acquired=False))("opaque-repo"):
            pass