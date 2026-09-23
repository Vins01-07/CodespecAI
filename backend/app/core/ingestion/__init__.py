"""
Ingestion package for CodeSpec AI.
Provides repository fetching, unpacking, filtering, scanning, and classification.
"""
from app.core.ingestion.classifier import FileClassifier
from app.core.ingestion.config import (
    ClassificationConfig,
    get_default_classification_config,
)
from app.core.ingestion.filters import (
    IGNORED_BINARY_EXTENSIONS,
    IGNORED_DIRECTORIES,
    IGNORED_FILES,
    SUPPORTED_EXTENSIONS,
    should_ignore,
)
from app.core.ingestion.git_fetcher import GitFetcher
from app.core.ingestion.scanner import RepoScanner
from app.core.ingestion.zip_handler import ZipHandler

__all__ = [
    "ClassificationConfig",
    "FileClassifier",
    "GitFetcher",
    "IGNORED_BINARY_EXTENSIONS",
    "IGNORED_DIRECTORIES",
    "IGNORED_FILES",
    "RepoScanner",
    "SUPPORTED_EXTENSIONS",
    "ZipHandler",
    "get_default_classification_config",
    "should_ignore",
]
