"""
Neo4j client wrapper for the graph layer.

Re-exports the driver/session helpers from app.db.neo4j so that the
graph layer is decoupled from the db layer and can be tested in isolation.
"""
from app.db.neo4j import get_driver, get_session, init_neo4j_schema

__all__ = ["get_driver", "get_session", "init_neo4j_schema"]
