"""
Content parsing coordination service for CodeSpecAI RAG.
Routes classified repository files to format parsers with robust error isolation.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from app.core.rag.parsers.base import BaseContentParser
from app.core.rag.parsers.code_parser import SourceCodeParser
from app.core.rag.parsers.config_parser import ConfigParser
from app.core.rag.parsers.markdown_parser import MarkdownParser
from app.core.rag.parsers.pdf_parser import PdfParser
from app.core.rag.parsers.text_parser import PlainTextParser
from app.models.classification import ClassifiedFile, FileType
from app.models.rag_models import (
    NormalizedDocument,
    ParserError,
    ParseResult,
    RepositoryParseResult,
)

logger = logging.getLogger(__name__)


class ContentParsingService:
    """
    Unified coordinator for multi-format repository content parsing.
    Dispatches ClassifiedFile instances to format-specific parsers.
    Guarantees that an error in any single file never crashes ingestion.
    """

    def __init__(
        self,
        code_parser: Optional[BaseContentParser] = None,
        markdown_parser: Optional[BaseContentParser] = None,
        pdf_parser: Optional[BaseContentParser] = None,
        text_parser: Optional[BaseContentParser] = None,
        config_parser: Optional[BaseContentParser] = None,
    ) -> None:
        self.parsers: dict[FileType, BaseContentParser] = {
            FileType.SOURCE_CODE: code_parser or SourceCodeParser(),
            FileType.MARKDOWN: markdown_parser or MarkdownParser(),
            FileType.PDF: pdf_parser or PdfParser(),
            FileType.PLAIN_TEXT: text_parser or PlainTextParser(),
            FileType.CONFIG: config_parser or ConfigParser(),
        }

    def parse_file(self, file: ClassifiedFile, repo_root: Path | str) -> ParseResult:
        """
        Parse a single ClassifiedFile with comprehensive exception catching.
        """
        root = Path(repo_root).resolve()
        file_path_str = file.file_path

        # If unsupported, skip parsing cleanly
        if file.file_type == FileType.UNSUPPORTED:
            return ParseResult(
                file_path=file_path_str,
                documents=[],
                errors=[
                    ParserError(
                        file_path=file_path_str,
                        error_type="UnsupportedFormat",
                        message=f"File format '{file.extension}' is unsupported for RAG extraction",
                    )
                ],
                is_successful=False,
            )

        parser = self.parsers.get(file.file_type)
        if not parser:
            return ParseResult(
                file_path=file_path_str,
                documents=[],
                errors=[
                    ParserError(
                        file_path=file_path_str,
                        error_type="NoParserAvailable",
                        message=f"No parser registered for file type {file.file_type}",
                    )
                ],
                is_successful=False,
            )

        try:
            return parser.parse(file, root)
        except Exception as exc:
            logger.error("Unexpected error parsing %s: %s", file_path_str, exc, exc_info=True)
            return ParseResult(
                file_path=file_path_str,
                documents=[],
                errors=[
                    ParserError(
                        file_path=file_path_str,
                        error_type="UnexpectedParserError",
                        message=f"Unhandled exception during parsing: {exc}",
                    )
                ],
                is_successful=False,
            )

    def parse_repository(
        self,
        files: list[ClassifiedFile],
        repo_root: Path | str,
        repository_id: str = "",
    ) -> RepositoryParseResult:
        """
        Parse a collection of classified files from a repository.
        Returns a RepositoryParseResult aggregating all normalized documents and structured errors.
        """
        root = Path(repo_root).resolve()
        repo_id = repository_id or (files[0].repository_id if files else root.name)

        all_documents: list[NormalizedDocument] = []
        all_errors: list[ParserError] = []
        counts_by_type: dict[str, int] = {ft.value: 0 for ft in FileType}

        for file in files:
            # Only process files flagged as processable unless explicitly requested
            if not file.is_processable:
                continue

            result = self.parse_file(file, root)
            if result.documents:
                all_documents.extend(result.documents)
                ft_val = file.file_type.value if hasattr(file.file_type, "value") else str(file.file_type)
                counts_by_type[ft_val] = counts_by_type.get(ft_val, 0) + len(result.documents)

            if result.errors:
                all_errors.extend(result.errors)

        return RepositoryParseResult(
            repository_id=repo_id,
            documents=all_documents,
            errors=all_errors,
            total_documents=len(all_documents),
            total_errors=len(all_errors),
            documents_by_type=counts_by_type,
        )
