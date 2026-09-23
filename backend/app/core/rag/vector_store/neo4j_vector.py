"""
Neo4j native vector store implementation for CodeSpecAI RAG.
Reuses the existing Neo4j 5 infrastructure using native vector index procedures.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Optional
from neo4j import Driver, GraphDatabase

from app.config import settings
from app.core.rag.vector_store.base import BaseVectorStore
from app.models.classification import FileType
from app.models.chunk_models import RAGChunk
from app.models.vector_models import VectorSearchResult, VectorStoreStats

logger = logging.getLogger(__name__)


class Neo4jVectorStore(BaseVectorStore):
    """
    Persists RAG chunks and vector embeddings directly inside Neo4j 5.
    Unifies AST Knowledge Graph entities with Dense Vector embeddings in the same database.
    Enforces repository isolation and re-indexing idempotency.
    """

    def __init__(
        self,
        driver: Optional[Driver] = None,
        index_name: str = "rag_chunk_embeddings",
        dimensions: int = 1536,
        uri: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
    ) -> None:
        self._index_name = index_name
        self._dimensions = dimensions

        if driver is not None:
            self._driver = driver
            self._owns_driver = False
        else:
            db_uri = uri or settings.NEO4J_URI
            user = username or settings.NEO4J_USERNAME
            pwd = password or settings.NEO4J_PASSWORD
            self._driver = GraphDatabase.driver(db_uri, auth=(user, pwd))
            self._owns_driver = True

    @property
    def index_name(self) -> str:
        return self._index_name

    @property
    def dimensions(self) -> int:
        return self._dimensions

    def close(self) -> None:
        """Close internal driver if owned."""
        if self._owns_driver and self._driver:
            self._driver.close()

    def create_or_get_collection(self, name: str, dimensions: int) -> bool:
        """Create vector index on :RAGChunk(embedding) if it does not exist."""
        self._index_name = name
        self._dimensions = dimensions

        cypher = f"""
        CREATE VECTOR INDEX {self._index_name} IF NOT EXISTS
        FOR (c:RAGChunk) ON (c.embedding)
        OPTIONS {{indexConfig: {{`vector.dimensions`: $dimensions, `vector.similarity_function`: 'cosine'}}}}
        """
        try:
            with self._driver.session() as session:
                session.run(cypher, {"dimensions": dimensions})
            logger.info("Ensured Neo4j vector index '%s' with %d dimensions", name, dimensions)
            return True
        except Exception as exc:
            logger.error("Failed to ensure vector index in Neo4j: %s", exc)
            raise

    def upsert_chunks(self, chunks: list[RAGChunk], repository_id: str) -> int:
        """
        Persist chunks with embeddings in Neo4j.
        Cleans existing chunks for repository_id to avoid duplicate vectors on re-indexing.
        """
        if not chunks:
            return 0

        # Ensure index exists first
        try:
            self.create_or_get_collection(self._index_name, self._dimensions)
        except Exception as exc:
            logger.warning("Could not auto-create vector index: %s", exc)

        # 1. Clean previous chunks for this repo to prevent duplicate vectors
        self.delete_repository(repository_id)

        # 2. Prepare parameters
        items_payload: list[dict[str, Any]] = []
        for c in chunks:
            if c.embedding is None:
                continue
            ft_str = c.file_type if isinstance(c.file_type, str) else c.file_type.value
            items_payload.append({
                "chunk_id": c.chunk_id,
                "repository_id": repository_id,
                "file_path": c.file_path,
                "file_type": ft_str,
                "language": c.language,
                "content": c.content,
                "start_line": c.start_line,
                "end_line": c.end_line,
                "page_number": c.page_number,
                "section": c.section,
                "symbol": c.symbol,
                "chunk_index": c.chunk_index,
                "total_chunks": c.total_chunks,
                "char_count": c.char_count,
                "token_count": c.token_count,
                "parent_metadata_json": json.dumps(c.parent_metadata),
                "embedding": c.embedding,
            })

        if not items_payload:
            return 0

        cypher = """
        UNWIND $batch AS item
        CREATE (c:RAGChunk {
            chunk_id: item.chunk_id,
            repository_id: item.repository_id,
            file_path: item.file_path,
            file_type: item.file_type,
            language: item.language,
            content: item.content,
            start_line: item.start_line,
            end_line: item.end_line,
            page_number: item.page_number,
            section: item.section,
            symbol: item.symbol,
            chunk_index: item.chunk_index,
            total_chunks: item.total_chunks,
            char_count: item.char_count,
            token_count: item.token_count,
            parent_metadata_json: item.parent_metadata_json,
            embedding: item.embedding
        })
        WITH c, item
        OPTIONAL MATCH (f:File {path: item.file_path})
        FOREACH (_ IN CASE WHEN f IS NOT NULL THEN [1] ELSE [] END |
            MERGE (c)-[:EXTRACTED_FROM]->(f)
        )
        RETURN count(c) AS inserted
        """

        try:
            with self._driver.session() as session:
                res = session.run(cypher, {"batch": items_payload})
                record = res.single()
                inserted = record["inserted"] if record else len(items_payload)
            logger.info("Upserted %d vector chunks into Neo4j for %s", inserted, repository_id)
            return inserted
        except Exception as exc:
            logger.error("Failed to upsert chunks into Neo4j: %s", exc)
            raise

    def delete_repository(self, repository_id: str) -> int:
        """Delete all RAGChunk nodes for a specific repository."""
        cypher = """
        MATCH (c:RAGChunk {repository_id: $repo_id})
        DETACH DELETE c
        RETURN count(c) AS deleted
        """
        try:
            with self._driver.session() as session:
                res = session.run(cypher, {"repo_id": repository_id})
                record = res.single()
                return record["deleted"] if record else 0
        except Exception as exc:
            logger.error("Failed to delete repository chunks in Neo4j: %s", exc)
            raise

    def similarity_search(
        self,
        query_embedding: list[float],
        repository_id: str,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> list[VectorSearchResult]:
        """
        Query Neo4j vector index isolated strictly to repository_id.
        """
        # Over-fetch slightly to allow post-filtering by repository_id and min_score
        fetch_k = max(top_k * 3, 20)
        cypher = f"""
        CALL db.index.vector.queryNodes('{self._index_name}', $fetch_k, $query_embedding)
        YIELD node, score
        WHERE node.repository_id = $repo_id AND score >= $min_score
        RETURN node, score
        ORDER BY score DESC
        LIMIT $top_k
        """

        results: list[VectorSearchResult] = []
        try:
            with self._driver.session() as session:
                cursor = session.run(
                    cypher,
                    {
                        "fetch_k": fetch_k,
                        "query_embedding": query_embedding,
                        "repo_id": repository_id,
                        "min_score": min_score,
                        "top_k": top_k,
                    },
                )
                for record in cursor:
                    node = record["node"]
                    score = float(record["score"])

                    parent_meta = {}
                    if "parent_metadata_json" in node and node["parent_metadata_json"]:
                        try:
                            parent_meta = json.loads(node["parent_metadata_json"])
                        except Exception:
                            pass

                    chunk = RAGChunk(
                        chunk_id=node.get("chunk_id", ""),
                        repository_id=node.get("repository_id", ""),
                        file_path=node.get("file_path", ""),
                        file_type=FileType(node.get("file_type", "source_code")),
                        language=node.get("language"),
                        content=node.get("content", ""),
                        start_line=node.get("start_line"),
                        end_line=node.get("end_line"),
                        page_number=node.get("page_number"),
                        section=node.get("section"),
                        symbol=node.get("symbol"),
                        chunk_index=node.get("chunk_index", 0),
                        total_chunks=node.get("total_chunks", 1),
                        char_count=node.get("char_count", 0),
                        token_count=node.get("token_count", 0),
                        parent_metadata=parent_meta,
                    )
                    results.append(VectorSearchResult(chunk=chunk, score=round(score, 4)))

            return results
        except Exception as exc:
            logger.error("Neo4j vector search failed: %s", exc)
            raise

    def count_chunks(self, repository_id: Optional[str] = None) -> int:
        cypher = """
        MATCH (c:RAGChunk)
        WHERE ($repo_id IS NULL OR c.repository_id = $repo_id)
        RETURN count(c) AS total
        """
        try:
            with self._driver.session() as session:
                res = session.run(cypher, {"repo_id": repository_id})
                record = res.single()
                return record["total"] if record else 0
        except Exception:
            return 0

    def get_stats(self, repository_id: Optional[str] = None) -> VectorStoreStats:
        total = self.count_chunks(None)
        repo_cnt = self.count_chunks(repository_id) if repository_id else 0
        return VectorStoreStats(
            total_chunks=total,
            repository_chunks=repo_cnt,
            index_name=self._index_name,
            dimensions=self._dimensions,
        )
