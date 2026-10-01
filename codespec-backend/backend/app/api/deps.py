"""
FastAPI dependency injection helpers.

Provides get_neo4j_session and get_graph_builder as FastAPI dependencies
so routes can declare them in function signatures.
"""
from __future__ import annotations

from typing import Generator

from neo4j import Session

from app.core.graph.builder import GraphBuilder
from app.core.graph.neo4j_client import get_session
from app.core.impact.service import ImpactService
from app.core.embeddings.service import BGEM3EmbeddingProvider
from app.core.retrieval.graph import Neo4jGraphRetriever
from app.core.retrieval.service import HybridRetrievalService
from app.core.vectors.indexer import SemanticIndexer
from app.core.vectors.store import QdrantVectorStore
from app.config import settings

# Reuse a single GraphBuilder per process (thread-safe, stateless)
_graph_builder = GraphBuilder()
_embedding_provider = BGEM3EmbeddingProvider()
_vector_store = QdrantVectorStore()
_graph_retriever = Neo4jGraphRetriever()
_hybrid_retrieval_service = HybridRetrievalService(
    _embedding_provider,
    _vector_store,
    _graph_retriever,
    score_threshold=settings.INDEX_SCORE_THRESHOLD,
)


def get_neo4j_session() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a Neo4j session, closed after the request."""
    with get_session() as session:
        yield session


def get_graph_builder() -> GraphBuilder:
    """FastAPI dependency: returns the shared GraphBuilder singleton."""
    return _graph_builder


def get_impact_service() -> ImpactService:
    """Return a lightweight service; it opens Neo4j sessions per operation."""
    return ImpactService()


def get_embedding_provider() -> BGEM3EmbeddingProvider:
    return _embedding_provider


def get_vector_store() -> QdrantVectorStore:
    return _vector_store


def get_hybrid_retrieval_service() -> HybridRetrievalService:
    return _hybrid_retrieval_service


def get_semantic_indexer() -> SemanticIndexer:
    return SemanticIndexer(
        _embedding_provider,
        _vector_store,
        batch_size=settings.INDEX_BATCH_SIZE,
    )
