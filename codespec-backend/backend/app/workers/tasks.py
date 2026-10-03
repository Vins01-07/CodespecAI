"""
Celery tasks for asynchronous repository ingestion.

Two entry-point tasks:
  ingest_git_repo  — clone/pull a git repository then parse + graph-build
  ingest_zip_repo  — unpack an uploaded zip then parse + graph-build

Both tasks share the same _run_pipeline() helper which:
  1. Scans files via RepoScanner
  2. Parses each file via ParserRegistry
  3. Builds/updates the Neo4j graph via GraphBuilder
"""
from __future__ import annotations

import logging
import hashlib
from pathlib import Path

import httpx
from redis import Redis
from redis.exceptions import ConnectionError as RedisConnectionError
from redis.exceptions import TimeoutError as RedisTimeoutError

from app.config import settings
from app.workers.celery_app import celery_app
from app.core.graph.builder import GraphBuilder
from app.core.ingestion.git_fetcher import GitFetcher
from app.core.ingestion.scanner import RepoScanner
from app.core.ingestion.zip_handler import ZipHandler
from app.core.parser.registry import ParserRegistry
from app.core.chunking.service import CodeChunker
from app.core.embeddings.service import BGEM3EmbeddingProvider
from app.core.indexing.service import RepositoryIndexingService
from app.core.indexing.lock import RedisRepositoryLock, RepositoryLockBusy
from app.core.vectors.indexer import SemanticIndexer
from app.core.vectors.store import QdrantVectorStore
from app.core.vectors.store import VectorStoreError

logger = logging.getLogger(__name__)


def _is_retryable_index_error(error: Exception) -> bool:
    transient_errors = (
        httpx.TransportError,
        RedisConnectionError,
        RedisTimeoutError,
        TimeoutError,
        ConnectionError,
        RepositoryLockBusy,
    )
    if isinstance(error, transient_errors):
        return True
    return isinstance(error, VectorStoreError) and isinstance(
        error.__cause__, transient_errors
    )

# Module-level singletons (created once per worker process)
_scanner = RepoScanner()
_registry = ParserRegistry()
_builder = GraphBuilder()


# ---------------------------------------------------------------------------
# Shared pipeline
# ---------------------------------------------------------------------------

def _run_pipeline(
    repo_dir: Path,
    repo_url: str,
    repo_name: str,
    branch: str = "main",
) -> dict:
    """Scan → parse → graph-build for a directory that is already on disk."""
    logger.info("Scanning %s …", repo_dir)
    file_paths = _scanner.scan(repo_dir)
    logger.info("Found %d source files", len(file_paths))

    logger.info("Parsing source files …")
    summaries = _registry.parse_files(file_paths, base_dir=repo_dir)
    logger.info("Parsed %d / %d files successfully", len(summaries), len(file_paths))

    logger.info("Building Neo4j graph …")
    stats = _builder.ingest_full_repo(repo_url, repo_name, branch, summaries)
    logger.info("Graph build complete: %s", stats)

    semantic_index_task_id = None
    try:
        semantic_index_task_id = index_repository_task.delay(
            str(repo_dir), repo_url
        ).id
    except Exception as exc:
        logger.warning("Could not enqueue semantic indexing (%s)", type(exc).__name__)

    return {
        "repo_url": repo_url,
        "repo_name": repo_name,
        "branch": branch,
        "files_scanned": len(file_paths),
        "files_parsed": len(summaries),
        "semantic_index_task_id": semantic_index_task_id,
        **stats,
    }


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    name="codespec.ingest_git_repo",
    max_retries=3,
    default_retry_delay=30,
)
def ingest_git_repo(self, repo_url: str, branch: str = "main") -> dict:
    """
    Clone (or pull) a git repository and run the full ingestion pipeline.

    Args:
        repo_url: Public or authenticated HTTPS/SSH clone URL.
        branch:   Git branch to check out (default: 'main').

    Returns:
        Ingestion stats dict.
    """
    try:
        # GitFetcher.__init__ accepts `workspace` as a Path
        fetcher = GitFetcher(workspace=Path(settings.REPO_WORKSPACE_DIR))
        repo_dir: Path = fetcher.fetch(repo_url, branch=branch)
        repo_name = repo_url.rstrip("/").split("/")[-1].removesuffix(".git")
        return _run_pipeline(
            repo_dir=repo_dir,
            repo_url=repo_url,
            repo_name=repo_name,
            branch=branch,
        )
    except Exception as exc:
        logger.error("ingest_git_repo failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    name="codespec.ingest_zip_repo",
    max_retries=2,
    default_retry_delay=10,
)
def ingest_zip_repo(self, zip_path: str, repo_name: str) -> dict:
    """
    Unpack a previously uploaded ZIP archive and run the full ingestion pipeline.

    Args:
        zip_path:  Absolute path to the ZIP file saved by the API route.
        repo_name: Human-readable name for this repository.

    Returns:
        Ingestion stats dict.
    """
    try:
        zip_file = Path(zip_path)
        zip_bytes = zip_file.read_bytes()

        # ZipHandler.extract() takes (bytes, filename) and returns (dest_path, repo_url)
        handler = ZipHandler(workspace=Path(settings.REPO_WORKSPACE_DIR))
        repo_dir, repo_url = handler.extract(zip_bytes, filename=repo_name)

        # Clean up the temporary ZIP file
        zip_file.unlink(missing_ok=True)

        return _run_pipeline(
            repo_dir=repo_dir,
            repo_url=repo_url,
            repo_name=repo_name,
            branch="local",
        )
    except Exception as exc:
        logger.error("ingest_zip_repo failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    name="codespec.index_repository",
    max_retries=3,
    default_retry_delay=30,
)
def index_repository_task(self, repo_dir: str, repo_url: str) -> dict:
    """Build or reconcile one repository's Qdrant index asynchronously."""
    try:
        vector_store = QdrantVectorStore()
        vector_store.ensure_collection()
        chunker = CodeChunker(
            max_chunk_chars=settings.INDEX_MAX_CHUNK_CHARS,
            overlap_lines=settings.INDEX_CHUNK_OVERLAP_LINES,
            min_chunk_chars=settings.INDEX_MIN_CHUNK_CHARS,
            max_file_bytes=settings.INDEX_MAX_FILE_BYTES,
        )
        embedding_provider = BGEM3EmbeddingProvider()
        redis_client = Redis.from_url(settings.REDIS_URL)
        indexer = SemanticIndexer(
            embedding_provider, vector_store, batch_size=settings.INDEX_BATCH_SIZE
        )
        service = RepositoryIndexingService(
            scanner=RepoScanner(),
            parser_registry=ParserRegistry(),
            chunker=chunker,
            indexer=indexer,
            vector_store=vector_store,
            max_file_bytes=settings.INDEX_MAX_FILE_BYTES,
            repository_lock=RedisRepositoryLock(
                redis_client,
                timeout=settings.INDEX_LOCK_TIMEOUT_SECONDS,
                blocking_timeout=settings.INDEX_LOCK_WAIT_SECONDS,
            ),
        )
        return service.index_repository(Path(repo_dir), repo_url)
    except Exception as exc:
        logger.error("Semantic indexing failed (%s)", type(exc).__name__)
        if _is_retryable_index_error(exc):
            raise self.retry(exc=exc) from exc
        raise
