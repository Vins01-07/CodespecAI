"""
Base interface and utilities for multi-format RAG content parsers.
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

from app.models.classification import ClassifiedFile
from app.models.rag_models import ParseResult

logger = logging.getLogger(__name__)


def read_text_safely(path: Path) -> tuple[Optional[str], Optional[str]]:
    """
    Attempt to read a text file using multiple common encodings.
    Returns (content, error_message). If successful, error_message is None.
    """
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    for enc in encodings:
        try:
            return path.read_text(encoding=enc), None
        except UnicodeDecodeError:
            continue
        except Exception as exc:
            return None, f"Failed to read {path.name}: {exc}"
    return None, f"Unable to decode {path.name} with standard encodings (utf-8, latin-1, cp1252)."


class BaseContentParser(ABC):
    """Abstract base class for all RAG format parsers."""

    @abstractmethod
    def parse(self, file: ClassifiedFile, repo_root: Path) -> ParseResult:
        """
        Parse a classified file into a ParseResult containing NormalizedDocument instances.
        Must handle errors gracefully without raising uncaught exceptions.
        """
        raise NotImplementedError
