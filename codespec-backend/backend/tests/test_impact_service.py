from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest

from app.core.impact.service import (
    EntityNotFoundError,
    ImpactService,
    ImpactStorageError,
)
from app.core.repository_identity import repository_id


ROOT_ID = "src/entry.py::run"


class FakeResult:
    def __init__(self, records: list[dict[str, Any]]):
        self.records = records

    def single(self) -> dict[str, Any] | None:
        return self.records[0] if self.records else None

    def __iter__(self) -> Iterator[dict[str, Any]]:
        return iter(self.records)


class FakeSession:
    def __init__(self, root: dict[str, Any] | None, outgoing: list, incoming: list):
        self.root = root
        self.outgoing = outgoing
        self.incoming = incoming
        self.calls: list[tuple[str, dict[str, Any]]] = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def run(self, query: str, **parameters: Any) -> FakeResult:
        self.calls.append((query, parameters))
        if "RETURN labels(root)" in query:
            return FakeResult([self.root] if self.root else [])
        if "(root)-[rels:" in query:
            return FakeResult(self.outgoing)
        return FakeResult(self.incoming)


def make_record(entity_ids: list[str], relationships: list[str], depth: int):
    return {
        "entities": [
            {
                "id": entity_id,
                "kind": "Function",
                "name": entity_id.rsplit("::", 1)[-1],
                "file_path": entity_id.split("::", 1)[0],
                "line_start": depth,
                "line_end": depth + 2,
            }
            for entity_id in entity_ids
        ],
        "relationships": relationships,
        "depth": depth,
    }


def test_impact_reports_direct_transitive_and_reverse_dependents():
    caller_id = "src/client.py::call_entry"
    upstream_id = "src/api.py::handle"
    direct_id = "src/service.py::load"
    transitive_id = "src/storage.py::read"
    fake_session = FakeSession(
        root={
            "id": ROOT_ID,
            "kind": "Function",
            "name": "run",
            "file_path": "src/entry.py",
            "line_start": 4,
            "line_end": 10,
        },
        outgoing=[
            make_record([ROOT_ID, direct_id], ["CALLS"], 1),
            make_record([ROOT_ID, direct_id, transitive_id], ["CALLS", "USES"], 2),
        ],
        incoming=[
            make_record([ROOT_ID, caller_id], ["CALLS"], 1),
            make_record([ROOT_ID, caller_id, upstream_id], ["CALLS", "CALLS"], 2),
        ],
    )

    result = ImpactService(lambda: fake_session).analyze(
        "https://example.test/repo", "function", ROOT_ID
    )

    assert [entry.entity.id for entry in result.direct_dependencies] == [direct_id]
    assert [entry.entity.id for entry in result.transitive_dependencies] == [transitive_id]
    assert [entry.entity.id for entry in result.affected_dependents] == [caller_id, upstream_id]
    assert result.affected_dependents[0].relationship_path == ["CALLS"]
    assert all(call[1]["repo_url"] == "https://example.test/repo" for call in fake_session.calls)
    assert all("candidate.repo_url = $repo_url" in call[0] for call in fake_session.calls[1:])


def test_impact_missing_entity_is_distinct_from_storage_failure():
    missing_session = FakeSession(None, [], [])
    with pytest.raises(EntityNotFoundError):
        ImpactService(lambda: missing_session).analyze("repo", "class", "Missing")

    def fail_session():
        raise OSError("database unavailable")

    with pytest.raises(ImpactStorageError):
        ImpactService(fail_session).analyze("repo", "class", "Missing")


def test_repository_id_is_stable_opaque_and_rejects_blank_keys():
    assert repository_id("  zip://fixture\n") == repository_id("zip://fixture")
    assert repository_id("zip://fixture") != "zip://fixture"
    with pytest.raises(ValueError):
        repository_id("  ")