"""Production hardening tests for Neo4j ImpactService: bounded Cypher & resilience."""

from __future__ import annotations

from typing import Any
import pytest

from app.core.impact.service import (
    EntityNotFoundError,
    ImpactService,
    ImpactStorageError,
)

ROOT_ID = "app/service.py::AuthService"


class FlakySession:
    """Simulates transient Neo4j errors before recovering."""

    def __init__(
        self,
        fail_count: int,
        transient_exception: type[Exception] = ConnectionError,
        root: dict[str, Any] | None = None,
        outgoing: list | None = None,
        incoming: list | None = None,
    ):
        self.fail_count = fail_count
        self.attempts = 0
        self.transient_exception = transient_exception
        self.root = root or {
            "id": ROOT_ID,
            "kind": "Class",
            "name": "AuthService",
            "file_path": "app/service.py",
            "line_start": 10,
            "line_end": 50,
        }
        self.outgoing = outgoing or []
        self.incoming = incoming or []
        self.recorded_params: list[dict[str, Any]] = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def run(self, query: str, **parameters: Any):
        self.attempts += 1
        self.recorded_params.append(parameters)
        if self.attempts <= self.fail_count:
            raise self.transient_exception("Simulated transient connection glitch")

        class Result:
            def __init__(self, items):
                self.items = items

            def single(self):
                return self.items[0] if self.items else None

            def __iter__(self):
                return iter(self.items)

        if "RETURN labels(root)" in query:
            return Result([self.root])
        if "(root)-[rels:" in query:
            return Result(self.outgoing)
        return Result(self.incoming)


def test_impact_bounds_enforced():
    """Verify max depth and max results bounds prevent unbounded graph traversals."""
    session = FlakySession(fail_count=0)
    service = ImpactService(
        session_factory=lambda: session,
        query_timeout_seconds=5.0,
        max_depth_bound=4,
        max_results_bound=50,
    )

    # Requesting excessive depth (99) and limit (5000)
    response = service.analyze(
        repo_url="https://github.com/org/repo",
        entity_kind="class",
        entity_id=ROOT_ID,
        max_depth=99,
        limit=5000,
    )

    assert response.max_depth == 4
    # Query parameters must carry the clamped limit and timeout
    last_params = session.recorded_params[-1]
    assert last_params["limit"] == 50
    assert last_params["timeout"] == 5.0


def test_impact_retries_transient_failures_and_recovers():
    """Verify tenacity retry recovers from transient failures with backoff."""
    flaky = FlakySession(fail_count=2, transient_exception=ConnectionError)
    service = ImpactService(
        session_factory=lambda: flaky,
        query_timeout_seconds=2.0,
    )

    response = service.analyze(
        repo_url="https://github.com/org/repo",
        entity_kind="class",
        entity_id=ROOT_ID,
    )

    assert response.root.id == ROOT_ID
    assert flaky.attempts >= 3


def test_impact_raises_storage_error_after_retry_exhaustion():
    """Verify persistent transient failure raises ImpactStorageError after exhausting retries."""
    always_failing = FlakySession(fail_count=10, transient_exception=ConnectionError)
    service = ImpactService(
        session_factory=lambda: always_failing,
        query_timeout_seconds=2.0,
    )

    with pytest.raises(ImpactStorageError):
        service.analyze(
            repo_url="https://github.com/org/repo",
            entity_kind="class",
            entity_id=ROOT_ID,
        )

    assert always_failing.attempts == 3


def test_impact_does_not_retry_entity_not_found():
    """Verify EntityNotFoundError is immediate and not misclassified as transient."""
    session = FlakySession(fail_count=0, root=None)
    session.root = None  # No entity found

    service = ImpactService(session_factory=lambda: session)

    with pytest.raises(EntityNotFoundError):
        service.analyze(
            repo_url="https://github.com/org/repo",
            entity_kind="class",
            entity_id="nonexistent::id",
        )

    # Only 1 attempt because root wasn't found
    assert session.attempts == 1
