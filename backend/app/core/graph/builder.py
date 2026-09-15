"""
GraphBuilder — writes parsed FileSummary objects into Neo4j.

All Cypher uses MERGE (idempotent) so re-ingesting the same repository
is always safe. A two-pass strategy is used:
  Pass 1 — create Repository / File / Function / Class nodes
  Pass 2 — link [:CALLS] edges after all function names are known

Node labels and relationships:
  (:Repository)  -[:CONTAINS]->  (:File)
  (:File)        -[:DEFINES]->   (:Function)
  (:File)        -[:DEFINES]->   (:Class)
  (:Class)       -[:HAS_METHOD]->(:Function)
  (:File)        -[:IMPORTS]->   (:File)         (best-effort)
  (:Function)    -[:CALLS]->     (:Function)     (cross-file)
"""
from __future__ import annotations

import logging
from typing import Any

from neo4j import Session

from app.core.graph.neo4j_client import get_session
from app.models.parser_models import FileSummary, FunctionDef

logger = logging.getLogger(__name__)


class GraphBuilder:
    """Builds and updates the Neo4j code graph from parsed FileSummary objects."""

    # ------------------------------------------------------------------
    # Public orchestration
    # ------------------------------------------------------------------

    def ingest_full_repo(
        self,
        repo_url: str,
        repo_name: str,
        branch: str,
        summaries: list[FileSummary],
    ) -> dict[str, int]:
        """
        Full ingestion pipeline for one repository.

        Returns a stats dict: {nodes_created, relationships_created}.
        """
        stats: dict[str, int] = {
            "files": 0,
            "functions": 0,
            "classes": 0,
            "imports_linked": 0,
            "calls_linked": 0,
        }

        with get_session() as session:
            # Pass 1a — Repository node
            self._merge_repository(session, repo_url, repo_name, branch)

            # Pass 1b — File + Function + Class nodes
            for summary in summaries:
                self._merge_file(session, summary, repo_url)
                stats["files"] += 1

                fn_count = self._merge_functions(session, summary, repo_url)
                stats["functions"] += fn_count

                cls_count = self._merge_classes(session, summary, repo_url)
                stats["classes"] += cls_count

            # Pass 1c — Import edges (file → file, best-effort)
            imp_count = self._link_imports(session, summaries, repo_url)
            stats["imports_linked"] = imp_count

            # Pass 2 — [:CALLS] edges (cross-file, two-pass)
            call_count = self._link_calls(session, summaries, repo_url)
            stats["calls_linked"] = call_count

        logger.info(
            "Ingested repo %s — %s", repo_url, stats
        )
        return stats

    # ------------------------------------------------------------------
    # Node creation
    # ------------------------------------------------------------------

    def _merge_repository(
        self, session: Session, repo_url: str, repo_name: str, branch: str
    ) -> None:
        session.run(
            """
            MERGE (r:Repository {url: $url})
            ON CREATE SET r.name = $name, r.branch = $branch, r.created_at = timestamp()
            ON MATCH  SET r.branch = $branch, r.updated_at = timestamp()
            """,
            url=repo_url,
            name=repo_name,
            branch=branch,
        )

    def _merge_file(
        self, session: Session, summary: FileSummary, repo_url: str
    ) -> None:
        session.run(
            """
            MATCH (r:Repository {url: $repo_url})
            MERGE (f:File {repo_url: $repo_url, path: $path})
            ON CREATE SET f.language = $language, f.created_at = timestamp()
            ON MATCH  SET f.language = $language, f.updated_at = timestamp()
            MERGE (r)-[:CONTAINS]->(f)
            """,
            repo_url=repo_url,
            path=summary.path,
            language=summary.language,
        )

    def _merge_functions(
        self, session: Session, summary: FileSummary, repo_url: str
    ) -> int:
        """Merge all top-level FunctionDef entries. Returns count created."""
        all_funcs: list[FunctionDef] = list(summary.functions)
        # Also include class methods for graph completeness
        for cls in summary.classes:
            all_funcs.extend(cls.methods)

        for fn in all_funcs:
            session.run(
                """
                MATCH (f:File {repo_url: $repo_url, path: $file_path})
                MERGE (fn:Function {
                    repo_url:  $repo_url,
                    file_path: $file_path,
                    name:      $name
                })
                ON CREATE SET
                    fn.line_start   = $line_start,
                    fn.line_end     = $line_end,
                    fn.parameters   = $parameters,
                    fn.return_type  = $return_type,
                    fn.docstring    = $docstring,
                    fn.created_at   = timestamp()
                ON MATCH SET
                    fn.line_start   = $line_start,
                    fn.line_end     = $line_end,
                    fn.parameters   = $parameters,
                    fn.return_type  = $return_type,
                    fn.docstring    = $docstring,
                    fn.updated_at   = timestamp()
                MERGE (f)-[:DEFINES]->(fn)
                """,
                repo_url=repo_url,
                file_path=summary.path,
                name=fn.name,
                line_start=fn.line_start,
                line_end=fn.line_end,
                parameters=fn.parameters,
                return_type=fn.return_type,
                docstring=fn.docstring,
            )
        return len(all_funcs)

    def _merge_classes(
        self, session: Session, summary: FileSummary, repo_url: str
    ) -> int:
        for cls in summary.classes:
            session.run(
                """
                MATCH (f:File {repo_url: $repo_url, path: $file_path})
                MERGE (c:Class {
                    repo_url:  $repo_url,
                    file_path: $file_path,
                    name:      $name
                })
                ON CREATE SET
                    c.line_start = $line_start,
                    c.line_end   = $line_end,
                    c.bases      = $bases,
                    c.docstring  = $docstring,
                    c.created_at = timestamp()
                ON MATCH SET
                    c.line_start = $line_start,
                    c.line_end   = $line_end,
                    c.bases      = $bases,
                    c.docstring  = $docstring,
                    c.updated_at = timestamp()
                MERGE (f)-[:DEFINES]->(c)
                """,
                repo_url=repo_url,
                file_path=summary.path,
                name=cls.name,
                line_start=cls.line_start,
                line_end=cls.line_end,
                bases=cls.bases,
                docstring=cls.docstring,
            )
            # Link class → its methods
            for method in cls.methods:
                session.run(
                    """
                    MATCH (c:Class {repo_url: $repo_url, file_path: $file_path, name: $class_name})
                    MATCH (fn:Function {repo_url: $repo_url, file_path: $file_path, name: $method_name})
                    MERGE (c)-[:HAS_METHOD]->(fn)
                    """,
                    repo_url=repo_url,
                    file_path=summary.path,
                    class_name=cls.name,
                    method_name=method.name,
                )
        return len(summary.classes)

    # ------------------------------------------------------------------
    # Relationship linking (Pass 2)
    # ------------------------------------------------------------------

    def _link_imports(
        self, session: Session, summaries: list[FileSummary], repo_url: str
    ) -> int:
        """
        Create [:IMPORTS] edges between File nodes.

        We attempt to resolve module names to actual file paths in the repo.
        Unresolved imports are silently skipped.
        """
        # Build a lookup: module stem → file path
        path_index: dict[str, str] = {}
        for s in summaries:
            from pathlib import Path as _Path
            stem = _Path(s.path).stem
            path_index[stem] = s.path
            # Also index by last path component without extension
            path_index[_Path(s.path).name.split(".")[0]] = s.path

        count = 0
        for summary in summaries:
            for imp in summary.imports:
                # Try matching the rightmost module component
                module_parts = imp.module.replace("/", ".").split(".")
                for part in reversed(module_parts):
                    if part and part in path_index:
                        target_path = path_index[part]
                        if target_path != summary.path:
                            session.run(
                                """
                                MATCH (src:File {repo_url: $repo_url, path: $src_path})
                                MATCH (tgt:File {repo_url: $repo_url, path: $tgt_path})
                                MERGE (src)-[:IMPORTS]->(tgt)
                                """,
                                repo_url=repo_url,
                                src_path=summary.path,
                                tgt_path=target_path,
                            )
                            count += 1
                        break
        return count

    def _link_calls(
        self, session: Session, summaries: list[FileSummary], repo_url: str
    ) -> int:
        """
        Create [:CALLS] edges between Function nodes (cross-file).

        Strategy: collect every function name → (file_path) mapping,
        then for each call site look up the callee by name.
        """
        # Build name → list of (file_path) — a name might exist in multiple files
        name_to_files: dict[str, list[str]] = {}
        for summary in summaries:
            all_fns = list(summary.functions)
            for cls in summary.classes:
                all_fns.extend(cls.methods)
            for fn in all_fns:
                name_to_files.setdefault(fn.name, []).append(summary.path)

        count = 0
        for summary in summaries:
            all_fns = list(summary.functions)
            for cls in summary.classes:
                all_fns.extend(cls.methods)

            for fn in all_fns:
                for raw_call in fn.calls:
                    # Strip attribute access: "self.helper" → "helper"
                    callee_name = raw_call.split(".")[-1].strip()
                    if callee_name not in name_to_files:
                        continue
                    for callee_file in name_to_files[callee_name]:
                        session.run(
                            """
                            MATCH (caller:Function {
                                repo_url:  $repo_url,
                                file_path: $caller_file,
                                name:      $caller_name
                            })
                            MATCH (callee:Function {
                                repo_url:  $repo_url,
                                file_path: $callee_file,
                                name:      $callee_name
                            })
                            MERGE (caller)-[:CALLS]->(callee)
                            """,
                            repo_url=repo_url,
                            caller_file=summary.path,
                            caller_name=fn.name,
                            callee_file=callee_file,
                            callee_name=callee_name,
                        )
                        count += 1
        return count

    # ------------------------------------------------------------------
    # Query helpers (used by API routes)
    # ------------------------------------------------------------------

    def get_repo_nodes(
        self, repo_url: str, skip: int = 0, limit: int = 500
    ) -> list[dict[str, Any]]:
        """Return all nodes belonging to a repository."""
        with get_session() as session:
            result = session.run(
                """
                MATCH (r:Repository {url: $url})-[:CONTAINS]->(f:File)
                OPTIONAL MATCH (f)-[:DEFINES]->(n)
                RETURN
                    f.path       AS file_path,
                    f.language   AS language,
                    labels(n)[0] AS node_type,
                    n.name       AS name,
                    n.line_start AS line_start,
                    n.line_end   AS line_end,
                    n.docstring  AS docstring
                SKIP $skip LIMIT $limit
                """,
                url=repo_url,
                skip=skip,
                limit=limit,
            )
            return [dict(record) for record in result]

    def get_repo_edges(
        self, repo_url: str, skip: int = 0, limit: int = 1000
    ) -> list[dict[str, Any]]:
        """Return all relationships for a repository."""
        with get_session() as session:
            result = session.run(
                """
                MATCH (a {repo_url: $url})-[r]->(b {repo_url: $url})
                RETURN
                    labels(a)[0] AS from_type,
                    a.name       AS from_name,
                    a.path       AS from_path,
                    type(r)      AS relationship,
                    labels(b)[0] AS to_type,
                    b.name       AS to_name,
                    b.path       AS to_path
                SKIP $skip LIMIT $limit
                """,
                url=repo_url,
                skip=skip,
                limit=limit,
            )
            return [dict(record) for record in result]

    def get_file_subgraph(
        self, repo_url: str, file_path: str
    ) -> dict[str, list[dict[str, Any]]]:
        """Return the sub-graph (nodes + edges) for a single file."""
        with get_session() as session:
            nodes_result = session.run(
                """
                MATCH (f:File {repo_url: $url, path: $path})-[:DEFINES]->(n)
                RETURN labels(n)[0] AS type, n.name AS name,
                       n.line_start AS line_start, n.line_end AS line_end,
                       n.docstring  AS docstring
                """,
                url=repo_url,
                path=file_path,
            )
            edges_result = session.run(
                """
                MATCH (f:File {repo_url: $url, path: $path})-[:DEFINES]->(a)
                MATCH (a)-[r]->(b)
                WHERE b.repo_url = $url
                RETURN a.name AS from_name, type(r) AS relationship, b.name AS to_name
                """,
                url=repo_url,
                path=file_path,
            )
            return {
                "nodes": [dict(r) for r in nodes_result],
                "edges": [dict(r) for r in edges_result],
            }

    def list_repositories(self) -> list[dict[str, Any]]:
        """Return all ingested repositories."""
        with get_session() as session:
            result = session.run(
                """
                MATCH (r:Repository)
                OPTIONAL MATCH (r)-[:CONTAINS]->(f:File)
                RETURN r.url AS url, r.name AS name, r.branch AS branch,
                       count(f) AS file_count
                ORDER BY r.name
                """
            )
            return [dict(record) for record in result]
