"""
GraphRetriever — Graph-aware codebase context retrieval using Neo4j.

Enables repository-scoped structural retrieval of code entities (functions,
classes, files, imports) and their AST/dependency relationships (CALLS, EXTENDS,
USES, INSTANTIATES, IMPORTS, DEFINES, HAS_METHOD).
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Callable, Optional, Sequence

from neo4j import Driver, Record, Session
from neo4j.exceptions import Neo4jError, ServiceUnavailable

from app.models.chunk_models import RAGChunk
from app.models.graph_retrieval_models import (
    GraphContextSummary,
    GraphNodeEntity,
    GraphRelationshipType,
    GraphRetrievalResult,
)

logger = logging.getLogger(__name__)

# Inverse relationship mapping for incoming relationships
INVERSE_RELATIONSHIP_MAP: dict[str, str] = {
    "CALLS": GraphRelationshipType.CALLED_BY.value,
    "CALLED_BY": GraphRelationshipType.CALLS.value,
    "INSTANTIATES": GraphRelationshipType.INSTANTIATED_BY.value,
    "INSTANTIATED_BY": GraphRelationshipType.INSTANTIATES.value,
    "USES": GraphRelationshipType.USED_BY.value,
    "USED_BY": GraphRelationshipType.USES.value,
    "EXTENDS": GraphRelationshipType.EXTENDED_BY.value,
    "EXTENDED_BY": GraphRelationshipType.EXTENDS.value,
    "HAS_METHOD": GraphRelationshipType.METHOD_OF.value,
    "METHOD_OF": GraphRelationshipType.HAS_METHOD.value,
    "DEFINES": GraphRelationshipType.DEFINED_IN.value,
    "DEFINED_IN": GraphRelationshipType.DEFINES.value,
    "IMPORTS": GraphRelationshipType.IMPORTED_BY.value,
    "IMPORTED_BY": GraphRelationshipType.IMPORTS.value,
    "CONTAINS": GraphRelationshipType.CONTAINED_IN.value,
    "CONTAINED_IN": GraphRelationshipType.CONTAINS.value,
}

ALLOWED_RELATIONSHIPS = set(GraphRelationshipType._value2member_map_.keys())


class GraphRetrievalError(Exception):
    """Base exception for graph retrieval errors."""
    pass


class GraphConnectionError(GraphRetrievalError):
    """Raised when Neo4j database is unreachable."""
    pass


class GraphRetriever:
    """
    Reusable retrieval service that queries structurally related codebase context
    from the Neo4j knowledge graph.
    """

    def __init__(
        self,
        driver: Optional[Driver] = None,
        session_factory: Optional[Callable[[], Session]] = None,
        strict: bool = False,
    ) -> None:
        """
        Initialize GraphRetriever.

        Args:
            driver: Optional Neo4j Driver instance. If omitted, uses default app driver.
            session_factory: Optional callable returning a Neo4j Session. Useful for mocking.
            strict: If True, graph connection/query errors raise GraphRetrievalError;
                    if False (default), errors are logged and empty lists returned to avoid
                    breaking RAG pipelines.
        """
        self._driver = driver
        self._session_factory = session_factory
        self.strict = strict

    def _get_session(self) -> Session:
        """Obtain a session from session_factory, injected driver, or app default."""
        if self._session_factory is not None:
            return self._session_factory()
        if self._driver is not None:
            return self._driver.session()
        # Default to existing application Neo4j session helper
        from app.db.neo4j import get_session
        return get_session()

    @staticmethod
    def _norm_path(path: str) -> str:
        """Normalize backslashes to forward slashes for cross-platform consistency."""
        return path.replace("\\", "/").strip()

    def _parse_entity_from_node(self, node: Any) -> GraphNodeEntity:
        """Parse a Neo4j node record into a normalized GraphNodeEntity."""
        props = dict(node) if hasattr(node, "items") else {}
        labels = list(getattr(node, "labels", []))
        node_type = labels[0] if labels else "Unknown"

        # Determine node identifier and name
        node_id = str(props.get("id") or props.get("path") or props.get("url") or "")
        node_name = str(props.get("name") or (Path(node_id).name if "/" in node_id else node_id))

        # Format function / method signature if parameters are available
        signature = None
        parameters = props.get("parameters")
        return_type = props.get("return_type")
        if parameters is not None or return_type is not None:
            params_str = ", ".join(parameters) if isinstance(parameters, list) else str(parameters or "")
            ret_str = f" -> {return_type}" if return_type else ""
            signature = f"({params_str}){ret_str}"

        return GraphNodeEntity(
            id=node_id,
            name=node_name,
            type=node_type,
            file_path=props.get("file_path") or props.get("path"),
            line_start=props.get("line_start"),
            line_end=props.get("line_end"),
            docstring=props.get("docstring"),
            signature=signature,
            properties={k: v for k, v in props.items() if k not in {
                "id", "name", "file_path", "path", "line_start", "line_end", "docstring", "parameters", "return_type"
            }},
        )

    def _run_query(self, query: str, parameters: dict[str, Any]) -> list[Record]:
        """Safely execute a Cypher query with parameters and error handling."""
        try:
            with self._get_session() as session:
                result = session.run(query, parameters)
                return list(result)
        except ServiceUnavailable as e:
            logger.warning("Neo4j service unavailable during graph retrieval: %s", e)
            if self.strict:
                raise GraphConnectionError(f"Neo4j service unavailable: {e}") from e
            return []
        except Neo4jError as e:
            logger.error("Neo4j query error during graph retrieval: %s", e)
            if self.strict:
                raise GraphRetrievalError(f"Neo4j query failed: {e}") from e
            return []
        except Exception as e:
            logger.error("Unexpected error executing graph query: %s", e)
            if self.strict:
                raise GraphRetrievalError(f"Unexpected graph retrieval error: {e}") from e
            return []

    # ------------------------------------------------------------------
    # 1. Symbol-Scoped Retrieval
    # ------------------------------------------------------------------

    def get_symbol_context(
        self,
        symbol: str,
        repository_id: str,
        depth: int = 1,
        relationship_types: Optional[Sequence[str]] = None,
        file_path: Optional[str] = None,
        limit: int = 50,
    ) -> list[GraphRetrievalResult]:
        """
        Retrieve related entities and structural relationships for a given code symbol.

        Finds:
          - Outgoing: calls, instantiations, uses, class inheritance, methods, defined items
          - Incoming: callers, instantiators, users, child classes, parent class/file
        
        Args:
            symbol: Target symbol ID, qualified name, or symbol name.
            repository_id: Repository ID or URL for multi-tenant isolation.
            depth: Traversal depth (default 1 hop; supports multi-hop expansion).
            relationship_types: Optional list of relationship types to include.
            file_path: Optional file path to disambiguate identical symbol names.
            limit: Maximum number of related entities to retrieve.

        Returns:
            Normalized list of GraphRetrievalResult items.
        """
        if not symbol or not repository_id:
            return []

        clean_symbol = symbol.strip()
        clean_file = self._norm_path(file_path) if file_path else None
        filter_rels = set(relationship_types) if relationship_types else None

        # Cypher to fetch 1-hop outgoing relationships
        outgoing_query = """
        MATCH (src {repo_url: $repo_id})
        WHERE (src.id = $symbol OR src.name = $symbol OR src.id ENDS WITH ("::" + $symbol))
          AND ($file_path IS NULL OR src.file_path = $file_path OR src.path = $file_path)
        MATCH (src)-[r]->(tgt)
        WHERE (tgt.repo_url = $repo_id OR tgt.url = $repo_id)
        RETURN
            src,
            type(r) AS rel_type,
            tgt,
            "outgoing" AS direction
        LIMIT $limit
        """

        # Cypher to fetch 1-hop incoming relationships
        incoming_query = """
        MATCH (tgt {repo_url: $repo_id})
        WHERE (tgt.id = $symbol OR tgt.name = $symbol OR tgt.id ENDS WITH ("::" + $symbol))
          AND ($file_path IS NULL OR tgt.file_path = $file_path OR tgt.path = $file_path)
        MATCH (src)-[r]->(tgt)
        WHERE (src.repo_url = $repo_id OR src.url = $repo_id)
        RETURN
            tgt AS src,
            type(r) AS rel_type,
            src AS tgt,
            "incoming" AS direction
        LIMIT $limit
        """

        params = {
            "repo_id": repository_id,
            "symbol": clean_symbol,
            "file_path": clean_file,
            "limit": limit,
        }

        results: list[GraphRetrievalResult] = []
        seen_keys: set[tuple[str, str, str]] = set()

        records = self._run_query(outgoing_query, params) + self._run_query(incoming_query, params)

        for rec in records:
            src_node = rec["src"]
            raw_rel = rec["rel_type"]
            tgt_node = rec["tgt"]
            direction = rec["direction"]

            normalized_rel = (
                INVERSE_RELATIONSHIP_MAP.get(raw_rel, raw_rel)
                if direction == "incoming"
                else raw_rel
            )

            if filter_rels and normalized_rel not in filter_rels and raw_rel not in filter_rels:
                continue

            related_entity = self._parse_entity_from_node(tgt_node)
            src_entity = self._parse_entity_from_node(src_node)

            dedup_key = (src_entity.id, normalized_rel, related_entity.id)
            if dedup_key in seen_keys:
                continue
            seen_keys.add(dedup_key)

            results.append(
                GraphRetrievalResult(
                    repository_id=repository_id,
                    file_path=src_entity.file_path or clean_file,
                    symbol=src_entity.name,
                    relationship=normalized_rel,
                    direction=direction,
                    depth=1,
                    related_entity=related_entity,
                    metadata={
                        "source_id": src_entity.id,
                        "source_type": src_entity.type,
                        "raw_relationship": raw_rel,
                    },
                )
            )

        # Multi-hop expansion if depth > 1
        if depth > 1 and results:
            current_depth = 1
            frontier = [r.related_entity.id for r in results if r.related_entity.id]
            visited = {clean_symbol} | set(frontier)

            while current_depth < depth and frontier and len(results) < limit:
                current_depth += 1
                next_frontier: list[str] = []

                for next_sym in frontier[:10]:  # Cap breadth per hop to avoid explosion
                    hop_results = self.get_symbol_context(
                        symbol=next_sym,
                        repository_id=repository_id,
                        depth=1,
                        relationship_types=relationship_types,
                        limit=limit - len(results),
                    )
                    for hr in hop_results:
                        if hr.related_entity.id not in visited:
                            visited.add(hr.related_entity.id)
                            next_frontier.append(hr.related_entity.id)
                            hr.depth = current_depth
                            results.append(hr)

                frontier = next_frontier

        return results[:limit]

    # ------------------------------------------------------------------
    # 2. File-Scoped Retrieval
    # ------------------------------------------------------------------

    def get_file_context(
        self,
        file_path: str,
        repository_id: str,
        include_imports: bool = True,
        include_definitions: bool = True,
        limit: int = 50,
    ) -> list[GraphRetrievalResult]:
        """
        Retrieve all structural context for a file:
          - Defined functions and classes (DEFINES)
          - Files imported by this file (IMPORTS)
          - Files importing this file (IMPORTED_BY)
        """
        if not file_path or not repository_id:
            return []

        clean_path = self._norm_path(file_path)
        results: list[GraphRetrievalResult] = []
        seen_keys: set[tuple[str, str]] = set()

        # 1. Definitions within the file
        if include_definitions:
            def_query = """
            MATCH (f:File {repo_url: $repo_id, path: $path})-[:DEFINES]->(item)
            RETURN f, item, labels(item)[0] AS item_type
            LIMIT $limit
            """
            records = self._run_query(def_query, {"repo_id": repository_id, "path": clean_path, "limit": limit})
            for rec in records:
                item_node = rec["item"]
                entity = self._parse_entity_from_node(item_node)
                key = (GraphRelationshipType.DEFINES.value, entity.id)
                if key not in seen_keys:
                    seen_keys.add(key)
                    results.append(
                        GraphRetrievalResult(
                            repository_id=repository_id,
                            file_path=clean_path,
                            symbol=None,
                            relationship=GraphRelationshipType.DEFINES.value,
                            direction="outgoing",
                            depth=1,
                            related_entity=entity,
                            metadata={"item_type": rec["item_type"]},
                        )
                    )

        # 2. Outgoing file imports
        if include_imports:
            imports_query = """
            MATCH (f:File {repo_url: $repo_id, path: $path})-[:IMPORTS]->(tgt:File)
            RETURN f, tgt
            LIMIT $limit
            """
            records = self._run_query(imports_query, {"repo_id": repository_id, "path": clean_path, "limit": limit})
            for rec in records:
                tgt_file = rec["tgt"]
                entity = self._parse_entity_from_node(tgt_file)
                key = (GraphRelationshipType.IMPORTS.value, entity.id)
                if key not in seen_keys:
                    seen_keys.add(key)
                    results.append(
                        GraphRetrievalResult(
                            repository_id=repository_id,
                            file_path=clean_path,
                            symbol=None,
                            relationship=GraphRelationshipType.IMPORTS.value,
                            direction="outgoing",
                            depth=1,
                            related_entity=entity,
                        )
                    )

            # 3. Incoming file imports (files that import this file)
            imported_by_query = """
            MATCH (src:File {repo_url: $repo_id})-[:IMPORTS]->(f:File {repo_url: $repo_id, path: $path})
            RETURN src, f
            LIMIT $limit
            """
            records = self._run_query(imported_by_query, {"repo_id": repository_id, "path": clean_path, "limit": limit})
            for rec in records:
                src_file = rec["src"]
                entity = self._parse_entity_from_node(src_file)
                key = (GraphRelationshipType.IMPORTED_BY.value, entity.id)
                if key not in seen_keys:
                    seen_keys.add(key)
                    results.append(
                        GraphRetrievalResult(
                            repository_id=repository_id,
                            file_path=clean_path,
                            symbol=None,
                            relationship=GraphRelationshipType.IMPORTED_BY.value,
                            direction="incoming",
                            depth=1,
                            related_entity=entity,
                        )
                    )

        return results[:limit]

    # ------------------------------------------------------------------
    # 3. Chunk-Scoped Retrieval
    # ------------------------------------------------------------------

    def get_chunk_context(
        self,
        chunk: RAGChunk,
        depth: int = 1,
        limit: int = 30,
    ) -> list[GraphRetrievalResult]:
        """
        Retrieve structural graph context for a specific RAGChunk.

        Tries the chunk's symbol first; if missing or yielding no results,
        checks parent_symbol; then falls back to file-level definitions and imports.
        """
        results: list[GraphRetrievalResult] = []

        # 1. Try chunk.symbol
        if chunk.symbol:
            results = self.get_symbol_context(
                symbol=chunk.symbol,
                repository_id=chunk.repository_id,
                depth=depth,
                file_path=chunk.file_path,
                limit=limit,
            )

        # 2. Try parent symbol from parent_metadata or section if no results yet
        parent_sym = None
        if chunk.parent_metadata:
            parent_sym = (
                chunk.parent_metadata.get("parent_symbol")
                or chunk.parent_metadata.get("class_name")
                or chunk.parent_metadata.get("parent")
            )
        if not parent_sym and chunk.section and not chunk.section.startswith("#"):
            parent_sym = chunk.section

        if not results and parent_sym:
            results = self.get_symbol_context(
                symbol=str(parent_sym),
                repository_id=chunk.repository_id,
                depth=depth,
                file_path=chunk.file_path,
                limit=limit,
            )

        # 3. Fallback to file context
        if not results and chunk.file_path:
            results = self.get_file_context(
                file_path=chunk.file_path,
                repository_id=chunk.repository_id,
                limit=limit,
            )

        return results

    # ------------------------------------------------------------------
    # 4. Batch Context Retrieval
    # ------------------------------------------------------------------

    def get_batch_context(
        self,
        symbols: Sequence[str] = (),
        file_paths: Sequence[str] = (),
        repository_id: str = "",
        depth: int = 1,
        limit_per_item: int = 20,
    ) -> list[GraphRetrievalResult]:
        """
        Bulk retrieval for multiple symbols and/or files with deduplication.
        """
        if not repository_id:
            return []

        all_results: list[GraphRetrievalResult] = []
        seen_keys: set[tuple[str, str, str]] = set()

        for sym in symbols:
            res = self.get_symbol_context(
                symbol=sym,
                repository_id=repository_id,
                depth=depth,
                limit=limit_per_item,
            )
            for r in res:
                key = (r.symbol or "", r.relationship, r.related_entity.id)
                if key not in seen_keys:
                    seen_keys.add(key)
                    all_results.append(r)

        for fp in file_paths:
            res = self.get_file_context(
                file_path=fp,
                repository_id=repository_id,
                limit=limit_per_item,
            )
            for r in res:
                key = (r.file_path or "", r.relationship, r.related_entity.id)
                if key not in seen_keys:
                    seen_keys.add(key)
                    all_results.append(r)

        return all_results

    # ------------------------------------------------------------------
    # 5. Path Discovery Between Symbols
    # ------------------------------------------------------------------

    def find_path_between_symbols(
        self,
        source_symbol: str,
        target_symbol: str,
        repository_id: str,
        max_depth: int = 3,
    ) -> list[GraphRetrievalResult]:
        """
        Find the shortest structural path (call chains, inheritance, usage)
        between two symbols within the repository.
        """
        if not source_symbol or not target_symbol or not repository_id:
            return []

        safe_depth = max(1, min(max_depth, 5))
        query = f"""
        MATCH (src {{repo_url: $repo_id}}), (tgt {{repo_url: $repo_id}})
        WHERE (src.id = $src OR src.name = $src OR src.id ENDS WITH ("::" + $src))
          AND (tgt.id = $tgt OR tgt.name = $tgt OR tgt.id ENDS WITH ("::" + $tgt))
          AND src <> tgt
        MATCH p = shortestPath((src)-[*..{safe_depth}]-(tgt))
        RETURN
            nodes(p) AS path_nodes,
            relationships(p) AS path_rels
        LIMIT 1
        """

        records = self._run_query(
            query,
            {"repo_id": repository_id, "src": source_symbol.strip(), "tgt": target_symbol.strip()},
        )

        if not records:
            return []

        rec = records[0]
        nodes = rec["path_nodes"]
        rels = rec["path_rels"]

        path_results: list[GraphRetrievalResult] = []
        for i in range(len(rels)):
            rel = rels[i]
            src_node = nodes[i]
            tgt_node = nodes[i + 1]

            src_entity = self._parse_entity_from_node(src_node)
            tgt_entity = self._parse_entity_from_node(tgt_node)

            rel_type = getattr(rel, "type", None) or (rel if isinstance(rel, str) else type(rel).__name__)

            path_results.append(
                GraphRetrievalResult(
                    repository_id=repository_id,
                    file_path=src_entity.file_path,
                    symbol=src_entity.name,
                    relationship=rel_type,
                    direction="outgoing",
                    depth=i + 1,
                    related_entity=tgt_entity,
                    metadata={"path_step": i + 1, "source_id": src_entity.id},
                )
            )

        return path_results

    # ------------------------------------------------------------------
    # 6. High-Level Summary Context
    # ------------------------------------------------------------------

    def get_hierarchical_context(
        self,
        symbol_or_file: str,
        repository_id: str,
        depth: int = 1,
    ) -> GraphContextSummary:
        """
        Convenience method returning a unified GraphContextSummary for a symbol or file.
        """
        results: list[GraphRetrievalResult] = []
        is_file = "/" in symbol_or_file or "\\" in symbol_or_file or "." in symbol_or_file

        if is_file:
            results = self.get_file_context(symbol_or_file, repository_id)
            return GraphContextSummary(
                repository_id=repository_id,
                focal_file=symbol_or_file,
                results=results,
            )
        else:
            results = self.get_symbol_context(symbol_or_file, repository_id, depth=depth)
            return GraphContextSummary(
                repository_id=repository_id,
                focal_symbol=symbol_or_file,
                results=results,
            )
