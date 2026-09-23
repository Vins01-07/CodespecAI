"""
Typed models and schemas for CodeSpecAI RAG Phase 2: Multi-format Content Parsing.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from pydantic import BaseModel, Field

from app.models.classification import FileType


class NormalizedDocument(BaseModel):
    """
    Common normalized document unit representing parsed code or documentation for RAG.
    Preserves exact source anchors: file path, line numbers, symbols, headings, and PDF pages.
    """
    repository_id: str = Field(..., description="Repository identifier or URL")
    file_path: str = Field(..., description="Normalized relative file path with forward slashes")
    file_type: FileType = Field(..., description="Classification category from Phase 1")
    language: Optional[str] = Field(None, description="Programming or format language (e.g. 'python', 'yaml')")
    content: str = Field(..., description="Extracted text or source code block")
    start_line: Optional[int] = Field(None, description="1-indexed starting line number in source file")
    end_line: Optional[int] = Field(None, description="1-indexed ending line number in source file")
    page_number: Optional[int] = Field(None, description="1-indexed page number for paginated documents (PDF)")
    section: Optional[str] = Field(None, description="Logical section (e.g. Markdown heading hierarchy, config key, class scope)")
    symbol: Optional[str] = Field(None, description="AST symbol identifier (e.g. function/class ID or name) when applicable")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional format-specific metadata (docstrings, parameters, etc.)")

    model_config = {
        "use_enum_values": True,
        "json_schema_extra": {
            "example": {
                "repository_id": "https://github.com/example/repo",
                "file_path": "src/services/auth.py",
                "file_type": "source_code",
                "language": "python",
                "content": "def validate_token(token: str) -> bool:\n    return len(token) > 10",
                "start_line": 15,
                "end_line": 17,
                "page_number": None,
                "section": "function validate_token",
                "symbol": "src/services/auth.py::validate_token",
                "metadata": {
                    "parameters": ["token: str"],
                    "return_type": "bool",
                },
            }
        },
    }


class ParserError(BaseModel):
    """Structured error entry when parsing a file fails or encounters warnings."""
    file_path: str = Field(..., description="Relative file path where error occurred")
    error_type: str = Field(..., description="Type/category of the error (e.g. 'ReadError', 'ParseError', 'EmptyContent')")
    message: str = Field(..., description="Detailed description of the issue")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="ISO timestamp")


class ParseResult(BaseModel):
    """Result of parsing a single file."""
    file_path: str
    documents: list[NormalizedDocument] = Field(default_factory=list)
    errors: list[ParserError] = Field(default_factory=list)
    is_successful: bool = True


class RepositoryParseResult(BaseModel):
    """Aggregate result of parsing multiple repository files."""
    repository_id: str
    documents: list[NormalizedDocument] = Field(default_factory=list)
    errors: list[ParserError] = Field(default_factory=list)
    total_documents: int = 0
    total_errors: int = 0
    documents_by_type: dict[str, int] = Field(default_factory=dict)
