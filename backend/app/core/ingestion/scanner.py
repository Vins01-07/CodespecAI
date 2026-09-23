"""
Repository scanner for CodeSpec AI.
Discovers repository files, integrates classification, and provides source file paths for AST parsing.
"""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from app.core.ingestion.classifier import FileClassifier
from app.core.ingestion.config import ClassificationConfig
from app.core.ingestion.filters import SUPPORTED_EXTENSIONS, should_ignore
from app.models.classification import (
    ClassifiedFile,
    FileType,
    RepositoryClassificationResult,
)


class RepoScanner:
    """
    Scanner for local repository directories.
    Provides:
    - scan(): Returns list of source code Paths for AST parser (legacy compatibility)
    - classify_repository(): Returns normalized ClassifiedFile list for RAG
    - scan_and_classify(): Returns RepositoryClassificationResult with summary
    """

    def __init__(
        self,
        classifier: Optional[FileClassifier] = None,
        config: Optional[ClassificationConfig] = None,
    ) -> None:
        self.classifier: FileClassifier = classifier or FileClassifier(config=config)
        self.supported_extensions: set[str] = set(SUPPORTED_EXTENSIONS)

    def scan(self, root_dir: Path | str) -> list[Path]:
        """
        Scan repository and return Paths of supported source code files for AST parsing.
        Maintains complete backward compatibility with existing callers and tests.
        """
        root = Path(root_dir).resolve()
        if not root.is_dir():
            raise FileNotFoundError(f"Directory not found: {root}")

        files: list[Path] = []
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if should_ignore(path, self.classifier.config):
                continue
            if path.suffix.lower() in self.supported_extensions:
                files.append(path)

        files.sort()
        return files

    def classify_repository(
        self,
        root_dir: Path | str,
        repository_id: str = "",
    ) -> list[ClassifiedFile]:
        """
        Scan and classify every non-ignored repository file into normalized metadata.
        """
        return self.classifier.classify_repository(root_dir, repository_id=repository_id)

    def scan_and_classify(
        self,
        root_dir: Path | str,
        repository_id: str = "",
    ) -> RepositoryClassificationResult:
        """
        Scan and classify repository, returning typed result with summary statistics.
        """
        return self.classifier.classify_repository_result(root_dir, repository_id=repository_id)