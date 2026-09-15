from neo4j import GraphDatabase, Driver, Session
from app.config import settings

_driver: Driver | None = None


def get_driver() -> Driver:
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
        )
    return _driver


def get_session() -> Session:
    return get_driver().session()


def init_neo4j_schema():
    """Create uniqueness constraints and indexes on startup."""
    with get_session() as session:
        session.run("CREATE CONSTRAINT repo_url IF NOT EXISTS FOR (r:Repository) REQUIRE r.url IS UNIQUE")
        session.run("CREATE CONSTRAINT file_id IF NOT EXISTS FOR (f:File) REQUIRE (f.repo_url, f.path) IS UNIQUE")
        session.run("CREATE INDEX func_name IF NOT EXISTS FOR (fn:Function) ON (fn.name)")
        session.run("CREATE INDEX class_name IF NOT EXISTS FOR (c:Class) ON (c.name)")