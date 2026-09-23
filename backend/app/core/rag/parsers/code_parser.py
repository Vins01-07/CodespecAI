"""
Source code parser for RAG.
Preserves AST symbols, class/method boundaries, line numbers, docstrings, and signatures.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from app.core.parser.registry import ParserRegistry
from app.core.rag.parsers.base import BaseContentParser, read_text_safely
from app.models.classification import ClassifiedFile, FileType
from app.models.rag_models import NormalizedDocument, ParserError, ParseResult

logger = logging.getLogger(__name__)


class SourceCodeParser(BaseContentParser):
    """
    Parses source code files using Tree-sitter AST parsers where available.
    Extracts class definitions, methods, and functions with exact line ranges and symbol IDs.
    Gracefully falls back to full-file structured document for languages without AST parsers.
    """

    def __init__(self, registry: Optional[ParserRegistry] = None) -> None:
        self.registry = registry or ParserRegistry()

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
                errors=[ParserError(file_path=file_path_str, error_type="EmptyFile", message="Source code file is empty")],
                is_successful=False,
            )

        lines = content.splitlines()
        total_lines = len(lines)

        def get_slice(start_line: int, end_line: int) -> str:
            start_idx = max(0, start_line - 1)
            end_idx = min(total_lines, end_line)
            return "\n".join(lines[start_idx:end_idx])

        documents: list[NormalizedDocument] = []

        # Attempt AST parsing using existing Tree-sitter ParserRegistry
        summary = None
        try:
            summary = self.registry.parse_file(abs_path, base_dir=repo_root)
        except Exception as exc:
            logger.warning("AST parser raised exception for %s: %s; falling back to line parse", file_path_str, exc)

        if summary and (summary.classes or summary.functions):
            # 1. Extract Classes and Methods
            for c in summary.classes:
                class_code = get_slice(c.line_start, c.line_end)
                documents.append(
                    NormalizedDocument(
                        repository_id=file.repository_id,
                        file_path=file_path_str,
                        file_type=FileType.SOURCE_CODE,
                        language=file.language,
                        content=class_code,
                        start_line=c.line_start,
                        end_line=c.line_end,
                        section=f"class {c.name}",
                        symbol=c.id or c.name,
                        metadata={
                            "kind": "class",
                            "name": c.name,
                            "bases": c.bases,
                            "docstring": c.docstring,
                            "method_count": len(c.methods),
                        },
                    )
                )

                for m in c.methods:
                    method_code = get_slice(m.line_start, m.line_end)
                    documents.append(
                        NormalizedDocument(
                            repository_id=file.repository_id,
                            file_path=file_path_str,
                            file_type=FileType.SOURCE_CODE,
                            language=file.language,
                            content=method_code,
                            start_line=m.line_start,
                            end_line=m.line_end,
                            section=f"method {c.name}.{m.name}",
                            symbol=m.id or f"{c.name}::{m.name}",
                            metadata={
                                "kind": "method",
                                "name": m.name,
                                "class_name": c.name,
                                "parameters": m.parameters,
                                "return_type": m.return_type,
                                "calls": m.calls,
                                "docstring": m.docstring,
                            },
                        )
                    )

            # 2. Extract Top-level Functions
            for f in summary.functions:
                func_code = get_slice(f.line_start, f.line_end)
                documents.append(
                    NormalizedDocument(
                        repository_id=file.repository_id,
                        file_path=file_path_str,
                        file_type=FileType.SOURCE_CODE,
                        language=file.language,
                        content=func_code,
                        start_line=f.line_start,
                        end_line=f.line_end,
                        section=f"function {f.name}",
                        symbol=f.id or f.name,
                        metadata={
                            "kind": "function",
                            "name": f.name,
                            "parameters": f.parameters,
                            "return_type": f.return_type,
                            "calls": f.calls,
                            "docstring": f.docstring,
                        },
                    )
                )
        else:
            # Script-like source file or language without AST parser
            documents.append(
                NormalizedDocument(
                    repository_id=file.repository_id,
                    file_path=file_path_str,
                    file_type=FileType.SOURCE_CODE,
                    language=file.language,
                    content=content,
                    start_line=1,
                    end_line=total_lines,
                    section="module",
                    symbol=None,
                    metadata={"kind": "module", "total_lines": total_lines},
                )
            )

        return ParseResult(
            file_path=file_path_str,
            documents=documents,
            errors=[],
            is_successful=True,
        )
