"""
PDF parser for RAG.
Extracts per-page text preserving 1-indexed page numbers using pypdf.
"""
from __future__ import annotations

import logging
from pathlib import Path

from app.core.rag.parsers.base import BaseContentParser
from app.models.classification import ClassifiedFile, FileType
from app.models.rag_models import NormalizedDocument, ParserError, ParseResult

logger = logging.getLogger(__name__)


class PdfParser(BaseContentParser):
    """
    Extracts text from PDF documents page by page.
    Preserves page_number (1-indexed), total pages, and isolates extraction errors.
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

        try:
            from pypdf import PdfReader
            from pypdf.errors import PdfReadError
        except ImportError as exc:
            return ParseResult(
                file_path=file_path_str,
                errors=[ParserError(file_path=file_path_str, error_type="MissingDependency", message=f"pypdf is required: {exc}")],
                is_successful=False,
            )

        documents: list[NormalizedDocument] = []
        errors: list[ParserError] = []

        try:
            reader = PdfReader(str(abs_path))
            total_pages = len(reader.pages)

            if total_pages == 0:
                return ParseResult(
                    file_path=file_path_str,
                    errors=[ParserError(file_path=file_path_str, error_type="EmptyPdf", message="PDF contains 0 pages")],
                    is_successful=False,
                )

            extracted_any = False
            for idx, page in enumerate(reader.pages):
                page_num = idx + 1
                try:
                    text = page.extract_text() or ""
                except Exception as page_exc:
                    logger.warning("Failed to extract page %d of %s: %s", page_num, file_path_str, page_exc)
                    errors.append(
                        ParserError(
                            file_path=file_path_str,
                            error_type="PageExtractError",
                            message=f"Page {page_num} extraction failed: {page_exc}",
                        )
                    )
                    continue

                clean_text = text.strip()
                if clean_text:
                    extracted_any = True
                    documents.append(
                        NormalizedDocument(
                            repository_id=file.repository_id,
                            file_path=file_path_str,
                            file_type=FileType.PDF,
                            language="pdf",
                            content=clean_text,
                            start_line=None,
                            end_line=None,
                            page_number=page_num,
                            section=f"Page {page_num}",
                            symbol=None,
                            metadata={"page": page_num, "total_pages": total_pages},
                        )
                    )

            if not extracted_any and not errors:
                errors.append(
                    ParserError(
                        file_path=file_path_str,
                        error_type="NoTextExtracted",
                        message="PDF contains no extractable text (e.g. scanned image or empty document)",
                    )
                )

            return ParseResult(
                file_path=file_path_str,
                documents=documents,
                errors=errors,
                is_successful=len(documents) > 0,
            )

        except Exception as exc:
            logger.warning("PDF parsing failed for %s: %s", file_path_str, exc)
            return ParseResult(
                file_path=file_path_str,
                errors=[ParserError(file_path=file_path_str, error_type="PdfReadError", message=f"Failed to read PDF: {exc}")],
                is_successful=False,
            )
