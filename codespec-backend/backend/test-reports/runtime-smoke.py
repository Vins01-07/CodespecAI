from pathlib import Path
from tempfile import TemporaryDirectory

from qdrant_client import QdrantClient, models

from app.core.graph.builder import GraphBuilder
from app.core.graph.neo4j_client import get_session
from app.core.parser.registry import ParserRegistry


def verify_qdrant() -> None:
    client = QdrantClient(url="http://qdrant:6333")
    collection = "codespec_verification_smoke"
    if client.collection_exists(collection):
        client.delete_collection(collection)

    try:
        client.create_collection(
            collection_name=collection,
            vectors_config=models.VectorParams(
                size=3, distance=models.Distance.COSINE
            ),
        )
        client.upsert(
            collection_name=collection,
            points=[
                models.PointStruct(
                    id="00000000-0000-0000-0000-000000000001",
                    vector=[1.0, 0.0, 0.0],
                    payload={"repository_id": "smoke-repo"},
                )
            ],
            wait=True,
        )
        hits = client.query_points(
            collection_name=collection,
            query=[1.0, 0.0, 0.0],
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="repository_id",
                        match=models.MatchValue(value="smoke-repo"),
                    )
                ]
            ),
            limit=1,
        ).points
        assert len(hits) == 1
        assert hits[0].payload["repository_id"] == "smoke-repo"
        print("Qdrant live filtered upsert/search: PASS (1 hit)")
    finally:
        client.delete_collection(collection)
    print("Qdrant smoke collection cleanup: PASS")


def verify_graph_builder() -> None:
    repo_url = "smoke://module02-verify-2026"
    try:
        with TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "smoke.py"
            source.write_text(
                "def caller():\n    return target()\n\n"
                "def target():\n    return 1\n",
                encoding="utf-8",
            )
            summaries = ParserRegistry().parse_files([source], base_dir=root)
            GraphBuilder().ingest_full_repo(
                repo_url, "verification", "main", summaries
            )
            with get_session() as session:
                record = session.run(
                    "MATCH (a:Function {repo_url: $repo_url, name: 'caller'})"
                    "-[:CALLS]->(b:Function {repo_url: $repo_url, name: 'target'}) "
                    "RETURN count(*) AS total",
                    repo_url=repo_url,
                ).single()
                edge_count = record["total"]
            print("GraphBuilder parsed source files:", len(summaries))
            print("Neo4j caller-CALLS-target edges:", edge_count)
            assert edge_count == 1, "Expected one CALLS edge"
    finally:
        with get_session() as session:
            session.run(
                "MATCH (n) WHERE n.repo_url = $repo_url DETACH DELETE n",
                repo_url=repo_url,
            )
            session.run(
                "MATCH (repository:Repository {url: $repo_url}) "
                "DETACH DELETE repository",
                repo_url=repo_url,
            )
    print("Neo4j graph smoke cleanup: PASS")


if __name__ == "__main__":
    verify_qdrant()
    verify_graph_builder()
