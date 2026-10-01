from pathlib import Path

from app.core.indexing.service import RepositoryIndexingService


class FakeScanner:
    def scan(self, root):
        return [root / "src" / "valid.py"]


class FakeRegistry:
    def parse_file(self, path, base_dir):
        return None


class FakeChunker:
    def chunk_markdown_file(self, repo_url, root, relative_path):
        raise AssertionError("No markdown files expected")


class FakeIndexer:
    def index_file(self, *args):
        raise AssertionError("Failed parser results must not replace existing vectors")


class FakeStore:
    def __init__(self):
        self.reconciled = None

    def delete_missing_files(self, repository_key, current_file_paths):
        self.reconciled = (repository_key, current_file_paths)


def test_repository_partial_parse_failure_does_not_prune_existing_index(tmp_path: Path):
    source_dir = tmp_path / "src"
    source_dir.mkdir()
    (source_dir / "valid.py").write_text("def run(): pass", encoding="utf-8")
    store = FakeStore()
    service = RepositoryIndexingService(
        FakeScanner(), FakeRegistry(), FakeChunker(), FakeIndexer(), store, 100000
    )

    result = service.index_repository(tmp_path, "repo-url")

    assert result["status"] == "partial"
    assert result["failed_files"] == 1
    assert store.reconciled is None