"""
Repository file classification layer for CodeSpecAI RAG.
Normalizes and classifies all repository files into typed metadata.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

from app.core.ingestion.config import (
    ClassificationConfig,
    get_default_classification_config,
)
from app.core.ingestion.filters import should_ignore
from app.models.classification import (
    ClassifiedFile,
    ClassificationSummary,
    FileType,
    RepositoryClassificationResult,
)

logger = logging.getLogger(__name__)


class FileClassifier:
    """
    Classifies repository files into typed metadata categories:
    - source_code
    - markdown
    - pdf
    - plain_text
    - config
    - unsupported

    Filters out vendor/generated content (.git, node_modules, .venv, dist, binary files, etc.).
    """

    def __init__(self, config: Optional[ClassificationConfig] = None) -> None:
        self.config: ClassificationConfig = config or get_default_classification_config()

    def classify_file(
        self,
        file_path: Path,
        repo_root: Path,
        repository_id: str = "",
    ) -> Optional[ClassifiedFile]:
        """
        Classify a single file. Returns None if the file should be ignored.
        """
        if should_ignore(file_path, self.config):
            return None

        # Compute normalized relative path with forward slashes
        try:
            rel_path = file_path.resolve().relative_to(repo_root.resolve()).as_posix()
        except ValueError:
            rel_path = file_path.name

        file_name = file_path.name
        ext = file_path.suffix.lower()

        file_type, language = self.config.classify(file_name, ext)
        is_processable = (file_type != FileType.UNSUPPORTED)

        size_bytes: Optional[int] = None
        try:
            if file_path.is_file():
                size_bytes = file_path.stat().st_size
        except OSError:
            pass

        return ClassifiedFile(
            repository_id=repository_id,
            file_path=rel_path,
            file_name=file_name,
            extension=ext,
            language=language,
            file_type=file_type,
            size_bytes=size_bytes,
            is_processable=is_processable,
        )

    def classify_repository(
        self,
        root_dir: Path | str,
        repository_id: str = "",
    ) -> list[ClassifiedFile]:
        """
        Walk a repository root directory, pruning ignored directories,
        and classify every valid file. Returns a sorted list of ClassifiedFile.
        """
        root = Path(root_dir).resolve()
        if not root.is_dir():
            raise FileNotFoundError(f"Directory not found: {root}")

        repo_id = repository_id or root.name
        classified_files: list[ClassifiedFile] = []

        # Use os.walk for directory-level pruning of ignored directories (node_modules, .git, etc.)
        for dirpath, dirnames, filenames in os.walk(root):
            # Prune ignored directories in-place so os.walk does not descend into them
            dirnames[:] = [
                d for d in dirnames
                if not self.config.is_ignored_directory(d)
            ]

            for fname in filenames:
                file_path = Path(dirpath) / fname
                classified = self.classify_file(file_path, repo_root=root, repository_id=repo_id)
                if classified is not None:
                    classified_files.append(classified)

        # Sort predictably by file_path
        classified_files.sort(key=lambda cf: cf.file_path)
        return classified_files

    def classify_repository_result(
        self,
        root_dir: Path | str,
        repository_id: str = "",
    ) -> RepositoryClassificationResult:
        """
        Scan and classify a repository, returning the full result with summary stats.
        """
        root = Path(root_dir).resolve()
        repo_id = repository_id or root.name
        files = self.classify_repository(root, repository_id=repo_id)

        counts_by_type: dict[str, int] = {ft.value: 0 for ft in FileType}
        counts_by_language: dict[str, int] = {}
        processable_count = 0
        unsupported_count = 0

        for f in files:
            ft_key = f.file_type.value if hasattr(f.file_type, "value") else str(f.file_type)
            counts_by_type[ft_key] = counts_by_type.get(ft_key, 0) + 1
            if f.is_processable:
                processable_count += 1
            else:
                unsupported_count += 1

            if f.language:
                counts_by_language[f.language] = counts_by_language.get(f.language, 0) + 1

        summary = ClassificationSummary(
            total_files_scanned=len(files),
            processable_files=processable_count,
            unsupported_files=unsupported_count,
            counts_by_type=counts_by_type,
            counts_by_language=counts_by_language,
        )

        return RepositoryClassificationResult(
            repository_id=repo_id,
            files=files,
            summary=summary,
        )

    @staticmethod
    def get_processable_files(files: list[ClassifiedFile]) -> list[ClassifiedFile]:
        """Filter a list of classified files down to only processable files for Phase 2 RAG."""
        return [f for f in files if f.is_processable]
