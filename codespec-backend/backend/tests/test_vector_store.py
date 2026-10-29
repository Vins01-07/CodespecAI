from types import SimpleNamespace
from uuid import NAMESPACE_URL, uuid5

import pytest
from qdrant_client import QdrantClient, models

from app.core.chunking.models import CodeChunk
from app.core.vectors.indexer import SemanticIndexer
from app.core.vectors.store import QdrantVectorStore, VectorStoreError


def make_chunk(file_revision="revision-1", index=0, repository_key="repo-hash"):
    return CodeChunk(
        chunk_id=str(uuid5(NAMESPACE_URL, f"{repository_key}:src/main.py::{index}")),
        repository_id=repository_key,
        file_path="src/main.py",
        entity_id="src/main.py::run",
        entity_name="run",
        entity_type="function",
        language="python",
        start_line=1,
        end_line=2,
        chunk_index=index,
        content_hash="chunk-hash",
        file_revision=file_revision,
        text="def run(): return 1",
    )


class FakeQdrant:
    def __init__(self, exists=False, vectors=None):
        self.exists = exists
        self.vectors = vectors
        self.created = []
        self.indexes = []
        self.upserts = []
        self.deletes = []
        self.queries = []

    def collection_exists(self, name):
        return self.exists

    def create_collection(self, **kwargs):
        self.created.append(kwargs)
        self.vectors = kwargs["vectors_config"]
        self.exists = True

    def get_collection(self, name):
        return SimpleNamespace(config=SimpleNamespace(params=SimpleNamespace(vectors=self.vectors)))

    def create_payload_index(self, **kwargs):
        self.indexes.append(kwargs)

    def upsert(self, **kwargs):
        self.upserts.append(kwargs)

    def delete(self, **kwargs):
        self.deletes.append(kwargs)

    def query_points(self, **kwargs):
        self.queries.append(kwargs)
        return SimpleNamespace(points=[])


def test_collection_creation_is_idempotent_and_indexes_provenance_fields():
    client = FakeQdrant()
    store = QdrantVectorStore(client=client, vector_size=3)

    store.ensure_collection()
    store.ensure_collection()

    assert len(client.created) == 1
    assert client.created[0]["vectors_config"]["dense"].size == 3
    assert len(client.indexes) == len(store.PAYLOAD_INDEX_FIELDS) * 2


def test_existing_incompatible_collection_is_not_recreated():
    client = FakeQdrant(
        exists=True,
        vectors={"dense": models.VectorParams(size=8, distance=models.Distance.COSINE)},
    )
    store = QdrantVectorStore(client=client, vector_size=3)

    with pytest.raises(VectorStoreError, match="incompatible"):
        store.ensure_collection()
    assert client.created == []


def test_upsert_and_search_keep_repository_filter_and_payload_provenance():
    client = FakeQdrant()
    store = QdrantVectorStore(client=client, vector_size=2)
    chunk = make_chunk()
    chunk = CodeChunk(**{**chunk.__dict__, "repository_id": "repo-hash"})

    store.upsert([chunk], [[0.6, 0.8]])
    store.search("repo-hash", [0.6, 0.8], top_k=5)

    point = client.upserts[0]["points"][0]
    assert point.id == chunk.chunk_id
    assert point.payload["file_path"] == "src/main.py"
    assert point.payload["entity_id"] == chunk.entity_id
    query_filter = client.queries[0]["query_filter"]
    assert query_filter.must[0].key == "repository_id"
    assert query_filter.must[0].match.value == "repo-hash"


def test_updates_and_deletes_are_scoped_to_repository_and_file():
    client = FakeQdrant()
    store = QdrantVectorStore(client=client, vector_size=2)
    chunk = make_chunk()

    store.upsert([chunk], [[1.0, 0.0]])
    store.upsert([chunk], [[0.0, 1.0]])
    store.delete_file("repo-hash", "src/main.py")
    store.delete_repository("repo-hash")
    store.delete_stale_file_revision("repo-hash", "src/main.py", "revision-2")

    first_id = client.upserts[0]["points"][0].id
    second_id = client.upserts[1]["points"][0].id
    assert first_id == second_id == chunk.chunk_id
    file_conditions = client.deletes[0]["points_selector"].filter.must
    assert {(item.key, item.match.value) for item in file_conditions} == {
        ("repository_id", "repo-hash"),
        ("file_path", "src/main.py"),
    }
    repo_conditions = client.deletes[1]["points_selector"].filter.must
    assert len(repo_conditions) == 1
    assert repo_conditions[0].key == "repository_id"
    assert client.deletes[2]["points_selector"].filter.must_not[0].match.value == "revision-2"


def test_indexer_prunes_old_revision_only_after_successful_upsert():
    class Provider:
        def embed_texts(self, texts):
            return [[1.0, 0.0] for _ in texts]

    class Store:
        def __init__(self, fail=False):
            self.fail = fail
            self.events = []

        def upsert(self, chunks, vectors):
            self.events.append("upsert")
            if self.fail:
                raise VectorStoreError("write failed")

        def delete_stale_file_revision(self, repo, path, revision):
            self.events.append("prune")

        def delete_file(self, repo, path):
            self.events.append("delete")

    chunk = make_chunk()
    store = Store()
    assert SemanticIndexer(Provider(), store, batch_size=1).index_file(
        "repo-hash", "src/main.py", "revision-1", [chunk]
    ) == 1
    assert store.events == ["upsert", "prune"]

    failing_store = Store(fail=True)
    with pytest.raises(VectorStoreError):
        SemanticIndexer(Provider(), failing_store).index_file(
            "repo-hash", "src/main.py", "revision-1", [chunk]
        )
    assert failing_store.events == ["upsert"]


def test_embedding_failure_in_later_batch_does_not_upsert_partial_file():
    class FailingProvider:
        def __init__(self):
            self.calls = 0

        def embed_texts(self, texts):
            self.calls += 1
            if self.calls == 2:
                raise RuntimeError("model failure")
            return [[1.0, 0.0] for _ in texts]

    class RecordingStore:
        def __init__(self):
            self.upserts = 0
            self.prunes = 0

        def upsert(self, chunks, vectors):
            self.upserts += 1

        def delete_stale_file_revision(self, *args):
            self.prunes += 1

        def delete_file(self, *args):
            self.prunes += 1

    store = RecordingStore()
    indexer = SemanticIndexer(FailingProvider(), store, batch_size=1)
    chunks = [make_chunk(index=index) for index in range(3)]

    with pytest.raises(RuntimeError):
        indexer.index_file("repo-hash", "src/main.py", "revision-1", chunks)

    assert store.upserts == 0
    assert store.prunes == 0


def test_qdrant_local_client_filters_and_deletes_with_real_sdk():
    client = QdrantClient(":memory:")
    store = QdrantVectorStore(client=client, collection_name="module2_test", vector_size=2)
    try:
        store.ensure_collection()
        first = make_chunk(repository_key="repo-a")
        second = make_chunk(repository_key="repo-b")
        store.upsert([first, second], [[1.0, 0.0], [1.0, 0.0]])

        hits = store.search("repo-a", [1.0, 0.0], top_k=5)
        linked = store.get_chunks_for_entities("repo-a", [first.entity_id])

        assert [hit.point_id for hit in hits] == [first.chunk_id]
        assert [hit.point_id for hit in linked] == [first.chunk_id]
        store.delete_file("repo-a", first.file_path)
        assert store.search("repo-a", [1.0, 0.0], top_k=5) == []
        assert [hit.point_id for hit in store.search("repo-b", [1.0, 0.0], top_k=5)] == [second.chunk_id]
    finally:
        client.close()