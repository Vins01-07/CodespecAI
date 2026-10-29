"""Incremental repository indexing without changing Module 1 scanner behavior."""

from __future__ import annotations

import hashlib
import logging
from contextlib import nullcontext
from pathlib import Path
from typing import Any, Callable

from app.core.chunking.service import ChunkingError, CodeChunker
from app.core.repository_identity import repository_id
from app.core.vectors.indexer import SemanticIndexer
from app.core.vectors.store import QdrantVectorStore
from app.core.ingestion.filters import should_ignore
from app.core.ingestion.scanner import RepoScanner
from app.core.parser.registry import ParserRegistry

logger = logging.getLogger(__name__)


class RepositoryIndexingService:
    def __init__(
        self,
        scanner: RepoScanner,
        parser_registry: ParserRegistry,
        chunker: CodeChunker,
        indexer: SemanticIndexer,
        vector_store: QdrantVectorStore,
        max_file_bytes: int,
        repository_lock: Callable[[str], Any] | None = None,
    ) -> None:
        self.scanner = scanner
        self.parser_registry = parser_registry
        self.chunker = chunker
        self.indexer = indexer
        self.vector_store = vector_store
        self.max_file_bytes = max_file_bytes
        self.repository_lock = repository_lock or (lambda _: nullcontext())

    def index_repository(self, repository_root: Path, repo_url: str) -> dict[str, Any]:
        root = repository_root.resolve(strict=True)
        if not root.is_dir():
            raise FileNotFoundError("Repository workspace was not found")
        repository_key = repository_id(repo_url)
        with self.repository_lock(repository_key):
            return self._index_repository_locked(root, repo_url, repository_key)

    def _index_repository_locked(
        self, root: Path, repo_url: str, repository_key: str
    ) -> dict[str, Any]:
        paths = self._discover_files(root)
        indexed_paths: set[str] = set()
        failed_files = 0
        files_indexed = 0
        chunks_indexed = 0

        for path in paths:
            relative_path = path.relative_to(root).as_posix()
            try:
                if path.stat().st_size > self.max_file_bytes:
                    failed_files += 1
                    continue
                if path.suffix.lower() == ".md":
                    chunks = self.chunker.chunk_markdown_file(repo_url, root, relative_path)
                else:
                    summary = self.parser_registry.parse_file(path, base_dir=root)
                    if summary is None:
                        failed_files += 1
                        continue
                    chunks = self.chunker.chunk_source_file(repo_url, root, summary)

                file_revision = (
                    chunks[0].file_revision if chunks else self._file_revision(path)
                )
                chunk_count = self.indexer.index_file(
                    repository_key, relative_path, file_revision, chunks
                )
                indexed_paths.add(relative_path)
                files_indexed += 1
                chunks_indexed += chunk_count
            except ChunkingError as exc:
                logger.warning("Repository file skipped during indexing (%s)", type(exc).__name__)
                failed_files += 1

        if failed_files == 0:
            self.vector_store.delete_missing_files(repository_key, indexed_paths)

        return {
            "repository_id": repository_key,
            "files_scanned": len(paths),
            "files_indexed": files_indexed,
            "chunks_indexed": chunks_indexed,
            "failed_files": failed_files,
            "status": "partial" if failed_files else "complete",
        }

    def _discover_files(self, root: Path) -> list[Path]:
        source_paths = self.scanner.scan(root)
        markdown_paths = [
            path
            for path in root.rglob("*")
            if path.is_file() and path.suffix.lower() == ".md" and not should_ignore(path)
        ]
        unique_paths = {path.resolve() for path in source_paths + markdown_paths}
        safe_paths = [
            path for path in unique_paths if path.is_relative_to(root)
        ]
        return sorted(safe_paths, key=lambda path: path.as_posix())

    @staticmethod
    def _file_revision(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as source_file:
            for block in iter(lambda: source_file.read(65536), b""):
                digest.update(block)
        return digest.hexdigest()