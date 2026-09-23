"""
Plain text parser for RAG.
Preserves line spans, encoding, and raw text content.
"""
from __future__ import annotations

from pathlib import Path

from app.core.rag.parsers.base import BaseContentParser, read_text_safely
from app.models.classification import ClassifiedFile, FileType
from app.models.rag_models import NormalizedDocument, ParserError, ParseResult


class PlainTextParser(BaseContentParser):
    """
    Parses plain text documents (.txt, .log, .rst, etc.) into normalized documents.
    Preserves line boundaries and source metadata.
    """

    def parse(self, file: ClassifiedFile, repo_root: Path) -> ParseResult:
        file_path_str = file.file_path
        abs_path = (repo_root / file_path_str).resolve()

        if not abs_path.exists():
            return ParseResult(
                file_path=file_path_str,
                errors=[ParserError(file_path=file_path_str, error_type="FileNotFound", message=f"File not found: {abs_path}")],
                is_successful=False,
            )

        content, err = read_text_safely(abs_path)
        if err or content is None:
            return ParseResult(
                file_path=file_path_str,
                errors=[ParserError(file_path=file_path_str, error_type="ReadError", message=err or "Read error")],
                is_successful=False,
            )

        if not content.strip():
            return ParseResult(
                file_path=file_path_str,
                errors=[ParserError(file_path=file_path_str, error_type="EmptyFile", message="Plain text file is empty")],
                is_successful=False,
            )

        lines = content.splitlines()
        total_lines = len(lines)

        doc = NormalizedDocument(
            repository_id=file.repository_id,
            file_path=file_path_str,
            file_type=FileType.PLAIN_TEXT,
            language=file.language or "text",
            content=content,
            start_line=1,
            end_line=total_lines,
            section="text",
            symbol=None,
            metadata={"total_lines": total_lines},
        )

        return ParseResult(
            file_path=file_path_str,
            documents=[doc],
            errors=[],
            is_successful=True,
        )
