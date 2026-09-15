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

# Reuse a single GraphBuilder per process (thread-safe, stateless)
_graph_builder = GraphBuilder()


def get_neo4j_session() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a Neo4j session, closed after the request."""
    with get_session() as session:
        yield session


def get_graph_builder() -> GraphBuilder:
    """FastAPI dependency: returns the shared GraphBuilder singleton."""
    return _graph_builder
