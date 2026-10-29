"""Stable, code-aware chunks with exact repository-relative provenance."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path, PurePosixPath
from uuid import NAMESPACE_URL, uuid5

from app.core.chunking.models import CodeChunk
from app.core.repository_identity import repository_id
from app.models.parser_models import FileSummary, FunctionDef


class ChunkingError(ValueError):
    """Raised when a candidate file is unsafe or exceeds configured bounds."""


class CodeChunker:
    def __init__(
        self,
        max_chunk_chars: int = 1800,
        overlap_lines: int = 2,
        min_chunk_chars: int = 20,
        max_file_bytes: int = 2_000_000,
    ) -> None:
        if max_chunk_chars < 1 or overlap_lines < 0 or min_chunk_chars < 0:
            raise ValueError("Chunk limits must be non-negative and max size positive")
        self.max_chunk_chars = max_chunk_chars
        self.overlap_lines = overlap_lines
        self.min_chunk_chars = min_chunk_chars
        self.max_file_bytes = max_file_bytes

    def chunk_source_file(
        self, repo_url: str, repository_root: Path, summary: FileSummary
    ) -> list[CodeChunk]:
        file_path, text = self._read_repository_file(repository_root, summary.path)
        repository_key = repository_id(repo_url)
        file_revision = self._sha256(text)
        lines = text.splitlines(keepends=True)
        if text and not lines:
            lines = [text]

        chunks: list[CodeChunk] = []
        class_method_ids = {
            method.id for class_def in summary.classes for method in class_def.methods
        }
        functions: dict[str, FunctionDef] = {}
        for function in summary.functions:
            if function.id and function.id not in class_method_ids:
                functions[function.id] = function
        for class_def in summary.classes:
            for method in class_def.methods:
                if method.id:
                    functions[method.id] = method

        for class_def in sorted(summary.classes, key=lambda item: (item.line_start, item.id or "")):
            methods = [method for method in class_def.methods if method.id]
            overview_end = (
                min(method.line_start for method in methods) - 1
                if methods
                else class_def.line_end
            )
            overview_end = max(class_def.line_start, overview_end)
            chunks.extend(
                self._chunks_for_segment(
                    repository_key,
                    file_path,
                    class_def.id or f"{file_path}::{class_def.name}",
                    class_def.name,
                    "class",
                    summary.language,
                    lines,
                    class_def.line_start,
                    overview_end,
                    file_revision,
                )
            )

        for function in sorted(functions.values(), key=lambda item: (item.line_start, item.id or "")):
            chunks.extend(
                self._chunks_for_segment(
                    repository_key,
                    file_path,
                    function.id or f"{file_path}::{function.name}",
                    function.name,
                    "method" if function.class_name else "function",
                    summary.language,
                    lines,
                    function.line_start,
                    function.line_end,
                    file_revision,
                )
            )

        if not chunks and text.strip():
            chunks.extend(
                self._chunks_for_segment(
                    repository_key,
                    file_path,
                    file_path,
                    Path(file_path).name,
                    "file",
                    summary.language,
                    lines,
                    1,
                    len(lines),
                    file_revision,
                )
            )
        return chunks

    def chunk_markdown_file(
        self, repo_url: str, repository_root: Path, relative_path: str
    ) -> list[CodeChunk]:
        file_path, text = self._read_repository_file(repository_root, relative_path)
        if not text.strip():
            return []

        repository_key = repository_id(repo_url)
        file_revision = self._sha256(text)
        source_lines = text.splitlines(keepends=True)
        sections = self._markdown_sections(source_lines)
        chunks: list[CodeChunk] = []
        for anchor, title, start_line, end_line, section_lines in sections:
            context = f"[{ ' > '.join(title) }] " if title else ""
            section_text = context + "".join(section_lines)
            chunks.extend(
                self._chunks_for_text(
                    repository_key,
                    file_path,
                    f"{file_path}::section::{anchor}",
                    title[-1].lstrip("# ") if title else Path(file_path).name,
                    "doc_section",
                    "markdown",
                    section_text,
                    start_line,
                    end_line,
                    file_revision,
                )
            )
        return chunks

    def _read_repository_file(self, root: Path, relative_path: str) -> tuple[str, str]:
        root_path = root.resolve()
        normalized = PurePosixPath(relative_path.replace("\\", "/"))
        if normalized.is_absolute() or ".." in normalized.parts:
            raise ChunkingError("File path must be repository-relative")
        candidate = (root_path / Path(*normalized.parts)).resolve(strict=True)
        if not candidate.is_relative_to(root_path) or not candidate.is_file():
            raise ChunkingError("File path is outside the repository")
        if candidate.stat().st_size > self.max_file_bytes:
            raise ChunkingError("File exceeds the configured indexing size limit")
        try:
            text = candidate.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            raise ChunkingError("File could not be read") from exc
        return normalized.as_posix(), text

    def _chunks_for_segment(
        self,
        repository_key: str,
        file_path: str,
        entity_id: str,
        entity_name: str,
        entity_type: str,
        language: str,
        lines: list[str],
        start_line: int,
        end_line: int,
        file_revision: str,
    ) -> list[CodeChunk]:
        segment = "".join(lines[max(start_line - 1, 0) : end_line])
        return self._chunks_for_text(
            repository_key,
            file_path,
            entity_id,
            entity_name,
            entity_type,
            language,
            segment,
            start_line,
            end_line,
            file_revision,
        )

    def _chunks_for_text(
        self,
        repository_key: str,
        file_path: str,
        entity_id: str,
        entity_name: str,
        entity_type: str,
        language: str,
        text: str,
        start_line: int,
        end_line: int,
        file_revision: str,
    ) -> list[CodeChunk]:
        if not text.strip():
            return []
        pieces = self._split_text(text, start_line)
        chunks: list[CodeChunk] = []
        for chunk_index, (piece, piece_start, piece_end) in enumerate(pieces):
            if len(piece.strip()) < self.min_chunk_chars:
                continue
            content_hash = self._sha256(piece)
            identity = "\0".join(
                ("chunk-v1", repository_key, file_path, entity_id, str(chunk_index))
            )
            chunks.append(
                CodeChunk(
                    chunk_id=str(uuid5(NAMESPACE_URL, identity)),
                    repository_id=repository_key,
                    file_path=file_path,
                    entity_id=entity_id,
                    entity_name=entity_name,
                    entity_type=entity_type,
                    language=language,
                    start_line=piece_start,
                    end_line=min(piece_end, end_line),
                    chunk_index=chunk_index,
                    content_hash=content_hash,
                    file_revision=file_revision,
                    text=piece,
                )
            )
        return chunks

    def _split_text(self, text: str, start_line: int) -> list[tuple[str, int, int]]:
        lines = text.splitlines(keepends=True)
        if not lines:
            lines = [text]
        pieces: list[tuple[str, int, int]] = []
        cursor = 0

        while cursor < len(lines):
            chunk_start = cursor
            selected: list[str] = []
            char_count = 0
            while cursor < len(lines):
                line = lines[cursor]
                if len(line) > self.max_chunk_chars:
                    if selected:
                        break
                    for offset in range(0, len(line), self.max_chunk_chars):
                        pieces.append(
                            (
                                line[offset : offset + self.max_chunk_chars],
                                start_line + cursor,
                                start_line + cursor,
                            )
                        )
                    cursor += 1
                    break
                if selected and char_count + len(line) > self.max_chunk_chars:
                    break
                selected.append(line)
                char_count += len(line)
                cursor += 1

            if selected:
                pieces.append(
                    (
                        "".join(selected),
                        start_line + chunk_start,
                        start_line + cursor - 1,
                    )
                )
            if cursor < len(lines) and selected:
                cursor = max(chunk_start + 1, cursor - self.overlap_lines)

        return pieces

    @staticmethod
    def _markdown_sections(
        lines: list[str],
    ) -> list[tuple[str, list[str], int, int, list[str]]]:
        sections: list[tuple[str, list[str], int, int, list[str]]] = []
        heading_stack: list[tuple[int, str]] = []
        current_lines: list[str] = []
        current_start = 1
        current_title: list[str] = []
        current_anchor = "intro"
        anchor_counts: dict[str, int] = {}

        def finish(end_line: int) -> None:
            if current_lines and "".join(current_lines).strip():
                sections.append(
                    (current_anchor, current_title.copy(), current_start, end_line, current_lines.copy())
                )

        for line_number, line in enumerate(lines, start=1):
            heading = re.match(r"^(#{1,6})\s+(.+?)\s*#*\s*$", line.rstrip("\r\n"))
            if heading:
                finish(line_number - 1)
                level = len(heading.group(1))
                heading_text = heading.group(2).strip()
                while heading_stack and heading_stack[-1][0] >= level:
                    heading_stack.pop()
                heading_stack.append((level, heading_text))
                current_title = [f"{'#' * level} {heading_text}" for level, heading_text in heading_stack]
                base_anchor = re.sub(
                    r"[^a-z0-9]+", "-", "-".join(item[1] for item in heading_stack).lower()
                ).strip("-") or "section"
                anchor_counts[base_anchor] = anchor_counts.get(base_anchor, 0) + 1
                current_anchor = (
                    base_anchor
                    if anchor_counts[base_anchor] == 1
                    else f"{base_anchor}-{anchor_counts[base_anchor]}"
                )
                current_lines = [line]
                current_start = line_number
            else:
                if not current_lines:
                    current_start = line_number
                current_lines.append(line)

        finish(len(lines))
        return sections

    @staticmethod
    def _sha256(value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()