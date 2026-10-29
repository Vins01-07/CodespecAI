"""Repository-scoped impact analysis over the existing Neo4j dependency graph with resilience and bounds."""

from __future__ import annotations

import logging
from typing import Any, Callable, Literal

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    wait_random,
)

try:
    from neo4j.exceptions import (
        DriverError,
        Neo4jError,
        ServiceUnavailable,
        SessionExpired,
        TransientError,
    )
    _TRANSIENT_GRAPH_EXCEPTIONS: tuple[type[Exception], ...] = (
        ServiceUnavailable,
        SessionExpired,
        TransientError,
        ConnectionError,
        OSError,
    )
except ImportError:
    _TRANSIENT_GRAPH_EXCEPTIONS = (ConnectionError, OSError)

from app.config import settings
from app.core.graph.neo4j_client import get_session
from app.core.repository_identity import repository_id
from app.models.impact import ImpactAnalysisResponse, ImpactEntry, ImpactEntity

logger = logging.getLogger(__name__)

EntityKind = Literal["function", "class", "file"]

_ENTITY_LABELS = {"function": "Function", "class": "Class", "file": "File"}
_ENTITY_KEY_PROPERTIES = {"function": "id", "class": "id", "file": "path"}
_RELATIONSHIP_TYPES = ("CALLS", "INSTANTIATES", "USES", "EXTENDS", "IMPORTS")
_MAX_DEPTH = 8
_MAX_RESULTS = 1000


class EntityNotFoundError(LookupError):
    """Raised when an exact repository-scoped graph entity does not exist."""


class ImpactStorageError(RuntimeError):
    """Raised when Neo4j cannot complete an impact query."""


class ImpactService:
    def __init__(
        self,
        session_factory: Callable[[], Any] = get_session,
        query_timeout_seconds: float = settings.NEO4J_QUERY_TIMEOUT_SECONDS,
        max_depth_bound: int = _MAX_DEPTH,
        max_results_bound: int = _MAX_RESULTS,
    ) -> None:
        self._session_factory = session_factory
        self.query_timeout_seconds = query_timeout_seconds
        self.max_depth_bound = max_depth_bound
        self.max_results_bound = max_results_bound

    def analyze(
        self,
        repo_url: str,
        entity_kind: EntityKind,
        entity_id: str,
        max_depth: int = settings.IMPACT_MAX_DEPTH,
        limit: int = settings.IMPACT_MAX_RESULTS,
    ) -> ImpactAnalysisResponse:
        if entity_kind not in _ENTITY_LABELS:
            raise ValueError("Unsupported entity kind")
        if not repo_url.strip() or not entity_id.strip():
            raise ValueError("Repository key and entity identifier are required")

        depth_limit = min(max(int(max_depth), 1), self.max_depth_bound)
        result_limit = min(max(int(limit), 1), self.max_results_bound)
        label = _ENTITY_LABELS[entity_kind]
        key_property = _ENTITY_KEY_PROPERTIES[entity_kind]

        root_query = f"""
            MATCH (root:{label} {{repo_url: $repo_url, {key_property}: $entity_id}})
            RETURN labels(root)[0] AS kind, coalesce(root.id, root.path) AS id,
                   root.name AS name, coalesce(root.file_path, root.path) AS file_path,
                   root.line_start AS line_start, root.line_end AS line_end
        """

        relationship_expression = "|".join(_RELATIONSHIP_TYPES)
        dependencies_query = self._traversal_query(
            relationship_expression, depth_limit, incoming=False
        )
        dependents_query = self._traversal_query(
            relationship_expression, depth_limit, incoming=True
        )

        query_parameters = {
            "repo_url": repo_url,
            "entity_id": entity_id,
            "limit": result_limit,
            "relationship_types": list(_RELATIONSHIP_TYPES),
            "timeout": self.query_timeout_seconds,
        }

        try:
            root_record, dependency_records, dependent_records = self._execute_with_retry(
                root_query=root_query,
                dependencies_query=dependencies_query,
                dependents_query=dependents_query,
                repo_url=repo_url,
                entity_id=entity_id,
                entity_kind=entity_kind,
                query_parameters=query_parameters,
            )
        except EntityNotFoundError:
            raise
        except Exception as exc:
            logger.warning("Impact graph query failed after retries (%s)", type(exc).__name__)
            raise ImpactStorageError("Impact graph query failed") from exc

        root = self._entity_from_record(root_record)
        direct, transitive, dependencies_truncated = self._entries_from_records(
            dependency_records, root.id
        )
        affected_direct, affected_transitive, affected_truncated = (
            self._entries_from_records(dependent_records, root.id)
        )
        affected = affected_direct + affected_transitive

        return ImpactAnalysisResponse(
            repository_id=repository_id(repo_url),
            root=root,
            direct_dependencies=direct,
            transitive_dependencies=transitive,
            affected_dependents=affected,
            max_depth=depth_limit,
            truncated=(
                dependencies_truncated
                or affected_truncated
                or len(dependency_records) >= result_limit
                or len(dependent_records) >= result_limit
            ),
        )

    def _execute_with_retry(
        self,
        root_query: str,
        dependencies_query: str,
        dependents_query: str,
        repo_url: str,
        entity_id: str,
        entity_kind: str,
        query_parameters: dict[str, Any],
    ) -> tuple[Any, list[Any], list[Any]]:
        """Execute Neo4j operations wrapped in tenacity retries with exponential backoff and jitter."""

        @retry(
            retry=retry_if_exception_type(_TRANSIENT_GRAPH_EXCEPTIONS),
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=0.1, min=0.1, max=1.5) + wait_random(0, 0.1),
            reraise=True,
        )
        def _attempt() -> tuple[Any, list[Any], list[Any]]:
            with self._session_factory() as session:
                root_result = session.run(root_query, repo_url=repo_url, entity_id=entity_id)
                root_record = root_result.single() if hasattr(root_result, "single") else None
                if root_record is None:
                    raise EntityNotFoundError(
                        f"{entity_kind} entity not found in the requested repository"
                    )

                dependency_records = list(
                    session.run(dependencies_query, **query_parameters)
                )
                dependent_records = list(
                    session.run(dependents_query, **query_parameters)
                )
                return root_record, dependency_records, dependent_records

        return _attempt()

    @staticmethod
    def _traversal_query(
        relationship_expression: str, depth_limit: int, incoming: bool
    ) -> str:
        traversal = (
            f"(root)<-[rels:{relationship_expression}*1..{depth_limit}]-(node)"
            if incoming
            else f"(root)-[rels:{relationship_expression}*1..{depth_limit}]->(node)"
        )
        return f"""
            MATCH p = {traversal}
            WHERE all(candidate IN nodes(p) WHERE candidate.repo_url = $repo_url)
              AND all(rel IN relationships(p)
                      WHERE type(rel) IN $relationship_types)
            WITH p, node, length(p) AS depth
            ORDER BY depth ASC
            LIMIT $limit
            RETURN [candidate IN nodes(p) | {{
                       id: coalesce(candidate.id, candidate.path),
                       kind: labels(candidate)[0],
                       name: candidate.name,
                       file_path: coalesce(candidate.file_path, candidate.path),
                       line_start: candidate.line_start,
                       line_end: candidate.line_end
                   }}] AS entities,
                   [rel IN relationships(p) | type(rel)] AS relationships,
                   depth
        """

    @staticmethod
    def _entity_from_record(record: Any) -> ImpactEntity:
        values = dict(record)
        return ImpactEntity(
            id=str(values.get("id") or ""),
            kind=str(values.get("kind") or "").lower(),
            name=values.get("name"),
            file_path=values.get("file_path"),
            line_start=values.get("line_start"),
            line_end=values.get("line_end"),
        )

    @classmethod
    def _entries_from_records(
        cls, records: list[Any], root_id: str
    ) -> tuple[list[ImpactEntry], list[ImpactEntry], bool]:
        unique: dict[str, ImpactEntry] = {}
        truncated = False
        for record in records:
            values = dict(record)
            entities = [ImpactEntity(**entity) for entity in values.get("entities", [])]
            target = entities[-1] if entities and entities[-1].id != root_id else None
            if target is None:
                continue

            entry = ImpactEntry(
                entity=target,
                depth=int(values.get("depth", max(len(entities) - 1, 1))),
                relationship_path=list(values.get("relationships", [])),
                entity_path=[entity.id for entity in entities],
            )
            previous = unique.get(target.id)
            if previous is None or entry.depth < previous.depth:
                unique[target.id] = entry

        ordered = sorted(unique.values(), key=lambda entry: (entry.depth, entry.entity.id))
        direct = [entry for entry in ordered if entry.depth == 1]
        transitive = [entry for entry in ordered if entry.depth > 1]
        return direct, transitive, truncated