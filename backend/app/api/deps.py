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
from app.core.rag.generation.rag_service import RAGService

# Reuse a single GraphBuilder per process (thread-safe, stateless)
_graph_builder = GraphBuilder()
_rag_service: RAGService | None = None


def get_neo4j_session() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a Neo4j session, closed after the request."""
    with get_session() as session:
        yield session


def get_graph_builder() -> GraphBuilder:
    """FastAPI dependency: returns the shared GraphBuilder singleton."""
    return _graph_builder


def get_rag_service() -> RAGService:
    """FastAPI dependency: returns the shared RAGService singleton."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service

