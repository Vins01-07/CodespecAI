"""
Markdown parser for RAG.
Preserves header hierarchies, section paths, line spans, and formatting.
"""
from __future__ import annotations

import re
from pathlib import Path

from app.core.rag.parsers.base import BaseContentParser, read_text_safely
from app.models.classification import ClassifiedFile, FileType
from app.models.rag_models import NormalizedDocument, ParserError, ParseResult

_HEADING_REGEX = re.compile(r"^(#{1,6})\s+(.+)$")


class MarkdownParser(BaseContentParser):
    """
    Parses Markdown files into section-aware documents.
    Tracks heading levels to construct hierarchical breadcrumb sections
    (e.g., 'Documentation > Getting Started > Installation') with exact line ranges.
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
                errors=[ParserError(file_path=file_path_str, error_type="EmptyFile", message="Markdown file is empty")],
                is_successful=False,
            )

        lines = content.splitlines()
        total_lines = len(lines)

        # Detect heading positions: list of (line_num_1_indexed, level_int, heading_text)
        headings: list[tuple[int, int, str]] = []
        in_code_fence = False

        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code_fence = not in_code_fence
                continue
            if in_code_fence:
                continue

            match = _HEADING_REGEX.match(stripped)
            if match:
                level = len(match.group(1))
                title = match.group(2).strip()
                headings.append((idx, level, title))

        documents: list[NormalizedDocument] = []

        if not headings:
            # No headings; return single document
            documents.append(
                NormalizedDocument(
                    repository_id=file.repository_id,
                    file_path=file_path_str,
                    file_type=FileType.MARKDOWN,
                    language=file.language or "markdown",
                    content=content,
                    start_line=1,
                    end_line=total_lines,
                    section="document",
                    symbol=None,
                    metadata={"total_lines": total_lines},
                )
            )
            return ParseResult(file_path=file_path_str, documents=documents, is_successful=True)

        # Handle introductory content before the first heading
        first_h_line = headings[0][0]
        if first_h_line > 1:
            intro_lines = lines[:first_h_line - 1]
            intro_text = "\n".join(intro_lines).strip()
            if intro_text:
                documents.append(
                    NormalizedDocument(
                        repository_id=file.repository_id,
                        file_path=file_path_str,
                        file_type=FileType.MARKDOWN,
                        language=file.language or "markdown",
                        content=intro_text,
                        start_line=1,
                        end_line=first_h_line - 1,
                        section="Overview",
                        symbol=None,
                        metadata={"level": 0},
                    )
                )

        # Build hierarchical sections
        # Stack keeps (level, title)
        stack: list[tuple[int, str]] = []

        for i, (h_line, level, title) in enumerate(headings):
            # Update breadcrumb stack
            while stack and stack[-1][0] >= level:
                stack.pop()
            stack.append((level, title))
            breadcrumb = " > ".join(t for _, t in stack)

            # Determine end line: up to next heading line - 1, or end of file
            if i + 1 < len(headings):
                next_h_line = headings[i + 1][0]
                sec_end = next_h_line - 1
            else:
                sec_end = total_lines

            sec_content = "\n".join(lines[h_line - 1:sec_end]).strip()

            documents.append(
                NormalizedDocument(
                    repository_id=file.repository_id,
                    file_path=file_path_str,
                    file_type=FileType.MARKDOWN,
                    language=file.language or "markdown",
                    content=sec_content,
                    start_line=h_line,
                    end_line=sec_end,
                    section=breadcrumb,
                    symbol=None,
                    metadata={"level": level, "heading": title},
                )
            )

        return ParseResult(file_path=file_path_str, documents=documents, is_successful=True)
