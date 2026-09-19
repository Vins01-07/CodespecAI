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
from pathlib import Path

from celery import shared_task

from app.config import settings
from app.core.graph.builder import GraphBuilder
from app.core.ingestion.git_fetcher import GitFetcher
from app.core.ingestion.scanner import RepoScanner
from app.core.ingestion.zip_handler import ZipHandler
from app.core.parser.registry import ParserRegistry

logger = logging.getLogger(__name__)

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

    return {
        "repo_url": repo_url,
        "repo_name": repo_name,
        "branch": branch,
        "files_scanned": len(file_paths),
        "files_parsed": len(summaries),
        **stats,
    }


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@shared_task(
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


@shared_task(
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
