"""Bounded repository-scoped structural expansion from Neo4j seed entities."""

from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Any

from app.core.graph.neo4j_client import get_session
from app.models.retrieval import GraphEvidence, RetrievalGraphPath

logger = logging.getLogger(__name__)
_RELATIONSHIP_TYPES = ("CALLS", "INSTANTIATES", "USES", "EXTENDS", "IMPORTS")


class GraphRetrievalError(RuntimeError):
    """Raised when Neo4j cannot provide structural retrieval evidence."""


class Neo4jGraphRetriever:
    def __init__(self, session_factory: Callable[[], Any] = get_session) -> None:
        self._session_factory = session_factory

    def expand(
        self, repo_url: str, seed_entity_ids: list[str], depth: int = 1, limit: int = 100
    ) -> list[GraphEvidence]:
        depth_limit = min(max(depth, 0), 4)
        result_limit = min(max(limit, 1), 500)
        frontier = list(dict.fromkeys(entity_id for entity_id in seed_entity_ids if entity_id))
        visited = set(frontier)
        paths: dict[str, tuple[list[str], list[str], list[str]]] = {
            entity_id: ([entity_id], [], []) for entity_id in frontier
        }
        evidence: list[GraphEvidence] = []
        if not frontier or depth_limit == 0:
            return evidence

        query = """
            MATCH (source {repo_url: $repo_url})
            WHERE coalesce(source.id, source.path) IN $source_ids
            MATCH (source)-[relationship]-(neighbor)
            WHERE type(relationship) IN $relationship_types
              AND neighbor.repo_url = $repo_url
            RETURN coalesce(source.id, source.path) AS source_id,
                   coalesce(neighbor.id, neighbor.path) AS entity_id,
                   labels(neighbor)[0] AS entity_kind,
                   neighbor.name AS entity_name,
                   coalesce(neighbor.file_path, neighbor.path) AS file_path,
                   neighbor.line_start AS line_start,
                   neighbor.line_end AS line_end,
                   type(relationship) AS relationship,
                   CASE WHEN startNode(relationship) = source
                        THEN 'outgoing' ELSE 'incoming' END AS direction
              ORDER BY entity_id, source_id, relationship
              LIMIT $limit
        """
        try:
            with self._session_factory() as session:
                for current_depth in range(1, depth_limit + 1):
                    if not frontier or len(evidence) >= result_limit:
                        break
                    records = list(
                        session.run(
                            query,
                            repo_url=repo_url,
                            source_ids=frontier,
                            relationship_types=list(_RELATIONSHIP_TYPES),
                            limit=max(result_limit - len(evidence), 1),
                        )
                    )
                    records.sort(
                        key=lambda record: (
                            record.get("entity_id", ""),
                            record.get("source_id", ""),
                            record.get("relationship", ""),
                        )
                    )
                    next_frontier: list[str] = []
                    for record in records:
                        values = dict(record)
                        entity_id = str(values.get("entity_id") or "")
                        source_id = str(values.get("source_id") or "")
                        if not entity_id or entity_id in visited or source_id not in paths:
                            continue
                        parent_entities, parent_relationships, parent_directions = paths[source_id]
                        entity_path = parent_entities + [entity_id]
                        relationships = parent_relationships + [str(values["relationship"])]
                        directions = parent_directions + [str(values["direction"])]
                        paths[entity_id] = (entity_path, relationships, directions)
                        visited.add(entity_id)
                        next_frontier.append(entity_id)
                        evidence.append(
                            GraphEvidence(
                                entity_id=entity_id,
                                entity_kind=str(values.get("entity_kind") or "Unknown"),
                                entity_name=values.get("entity_name"),
                                file_path=values.get("file_path"),
                                line_start=values.get("line_start"),
                                line_end=values.get("line_end"),
                                rank=len(evidence) + 1,
                                path=RetrievalGraphPath(
                                    entity_ids=entity_path,
                                    relationships=relationships,
                                    directions=directions,
                                    depth=current_depth,
                                ),
                            )
                        )
                        if len(evidence) >= result_limit:
                            break
                    frontier = next_frontier
        except Exception as exc:
            logger.warning("Graph retrieval failed (%s)", type(exc).__name__)
            raise GraphRetrievalError("Graph retrieval failed") from exc
        return evidence