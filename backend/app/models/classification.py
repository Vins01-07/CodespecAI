"""
Typed models and schemas for repository file classification in CodeSpecAI RAG.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class FileType(str, Enum):
    """Classification category for files within a repository."""
    SOURCE_CODE = "source_code"
    MARKDOWN = "markdown"
    PDF = "pdf"
    PLAIN_TEXT = "plain_text"
    CONFIG = "config"
    UNSUPPORTED = "unsupported"


class ClassifiedFile(BaseModel):
    """
    Normalized metadata for a classified file in a repository.
    """
    repository_id: str = Field(..., description="Unique repository identifier or clone URL")
    file_path: str = Field(..., description="Normalized relative path within the repository (using forward slashes)")
    file_name: str = Field(..., description="Base name of the file including extension")
    extension: str = Field(..., description="File extension in lowercase with leading dot (e.g. '.py'), or empty string")
    language: Optional[str] = Field(None, description="Programming or markup language when applicable (e.g. 'python', 'yaml')")
    file_type: FileType = Field(..., description="Classification category for downstream RAG processing")
    size_bytes: Optional[int] = Field(None, description="Size of the file in bytes")
    is_processable: bool = Field(True, description="Whether this file should be ingested and chunked in Phase 2 RAG")

    model_config = {
        "use_enum_values": True,
        "json_schema_extra": {
            "example": {
                "repository_id": "https://github.com/example/repo",
                "file_path": "src/main.py",
                "file_name": "main.py",
                "extension": ".py",
                "language": "python",
                "file_type": "source_code",
                "size_bytes": 1024,
                "is_processable": True,
            }
        },
    }


class ClassificationSummary(BaseModel):
    """Statistical summary of repository content classification."""
    total_files_scanned: int = Field(0, description="Total non-ignored files discovered and classified")
    processable_files: int = Field(0, description="Total files suitable for RAG processing")
    unsupported_files: int = Field(0, description="Files marked as unsupported")
    counts_by_type: dict[str, int] = Field(default_factory=dict, description="File count per FileType category")
    counts_by_language: dict[str, int] = Field(default_factory=dict, description="File count per detected language")


class RepositoryClassificationResult(BaseModel):
    """Complete result container for a repository classification scan."""
    repository_id: str
    files: list[ClassifiedFile]
    summary: ClassificationSummary
