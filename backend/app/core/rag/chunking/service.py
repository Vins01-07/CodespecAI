"""
Semantic chunking service for CodeSpecAI RAG.
Produces retrieval-ready, deterministic, traceable chunks from normalized repository content.
"""
from __future__ import annotations

import hashlib
import logging
from typing import Optional

from app.core.rag.chunking.config import ChunkingConfig, get_default_chunking_config
from app.models.classification import FileType
from app.models.chunk_models import ChunkingResult, RAGChunk
from app.models.rag_models import NormalizedDocument

logger = logging.getLogger(__name__)


def generate_deterministic_chunk_id(
    repository_id: str,
    file_path: str,
    anchor: str,
    chunk_index: int,
    content: str,
) -> str:
    """Generate a stable, reproducible chunk ID hash."""
    seed = f"{repository_id}:{file_path}:{anchor}:{chunk_index}:{content[:64]}"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:12]
    # Clean file path for id representation
    clean_path = file_path.replace("\\", "/")
    return f"{clean_path}:{anchor}:{chunk_index}:{digest}"


class SemanticChunkingService:
    """
    Unified content-aware chunking service.
    Converts NormalizedDocument objects into RAGChunk records.
    - Preserves function/method/class boundaries for source code.
    - Preserves section hierarchies for markdown.
    - Preserves 1-indexed page numbers for PDF.
    - Uses configurable size and overlap with zero unnecessary splitting.
    """

    def __init__(self, config: Optional[ChunkingConfig] = None) -> None:
        self.config: ChunkingConfig = config or get_default_chunking_config()

    def chunk_document(self, doc: NormalizedDocument) -> list[RAGChunk]:
        """Convert a single NormalizedDocument into one or more RAGChunks."""
        content = doc.content.strip()
        if len(content) < self.config.min_chunk_size:
            return []

        ft = doc.file_type if isinstance(doc.file_type, FileType) else FileType(doc.file_type)

        if ft == FileType.SOURCE_CODE:
            return self._chunk_source_code(doc)
        elif ft == FileType.MARKDOWN:
            return self._chunk_markdown(doc)
        elif ft == FileType.PDF:
            return self._chunk_pdf(doc)
        else:
            return self._chunk_text_or_config(doc)

    def chunk_documents(
        self,
        documents: list[NormalizedDocument],
        repository_id: str = "",
    ) -> ChunkingResult:
        """Chunk a collection of documents into a ChunkingResult."""
        repo_id = repository_id or (documents[0].repository_id if documents else "")
        all_chunks: list[RAGChunk] = []
        counts_by_type: dict[str, int] = {ft.value: 0 for ft in FileType}

        for doc in documents:
            chunks = self.chunk_document(doc)
            all_chunks.extend(chunks)

            ft_val = doc.file_type if isinstance(doc.file_type, str) else doc.file_type.value
            counts_by_type[ft_val] = counts_by_type.get(ft_val, 0) + len(chunks)

        return ChunkingResult(
            repository_id=repo_id,
            total_documents_processed=len(documents),
            total_chunks_produced=len(all_chunks),
            chunks=all_chunks,
            chunks_by_type=counts_by_type,
        )

    # ---------------------------------------------------------------------------
    # Content-aware chunking strategies
    # ---------------------------------------------------------------------------

    def _chunk_source_code(self, doc: NormalizedDocument) -> list[RAGChunk]:
        content = doc.content.strip()
        # If the code fits within code_chunk_size, keep it completely intact (atomic function/class)
        if len(content) <= self.config.code_chunk_size:
            return [self._build_chunk(doc, content, doc.start_line, doc.end_line, 0, 1)]

        # If oversized, split along lines with line-based overlap
        lines = content.splitlines()
        base_start = doc.start_line or 1

        raw_chunks: list[tuple[str, int, int]] = []
        curr_lines: list[str] = []
        curr_chars = 0
        window_start_idx = 0

        for idx, line in enumerate(lines):
            curr_lines.append(line)
            curr_chars += len(line) + 1

            if curr_chars >= self.config.code_chunk_size:
                chunk_str = "\n".join(curr_lines).strip()
                if len(chunk_str) >= self.config.min_chunk_size:
                    start_l = base_start + window_start_idx
                    end_l = base_start + idx
                    raw_chunks.append((chunk_str, start_l, end_l))

                # Step forward with overlap
                overlap_chars = 0
                step_idx = len(curr_lines) - 1
                while step_idx > 0 and overlap_chars < self.config.code_chunk_overlap:
                    overlap_chars += len(curr_lines[step_idx]) + 1
                    step_idx -= 1

                curr_lines = curr_lines[step_idx:]
                curr_chars = sum(len(l) + 1 for l in curr_lines)
                window_start_idx = max(0, idx - len(curr_lines) + 1)

        # Append remaining lines
        if curr_lines:
            chunk_str = "\n".join(curr_lines).strip()
            if len(chunk_str) >= self.config.min_chunk_size:
                start_l = base_start + window_start_idx
                end_l = base_start + len(lines) - 1
                raw_chunks.append((chunk_str, start_l, end_l))

        total = max(1, len(raw_chunks))
        return [
            self._build_chunk(doc, text, s_line, e_line, i, total)
            for i, (text, s_line, e_line) in enumerate(raw_chunks)
        ]

    def _chunk_markdown(self, doc: NormalizedDocument) -> list[RAGChunk]:
        content = doc.content.strip()
        # If markdown section fits within chunk_size, preserve intact
        if len(content) <= self.config.chunk_size:
            return [self._build_chunk(doc, content, doc.start_line, doc.end_line, 0, 1)]

        # Split oversized markdown section by paragraph breaks
        segments = self._split_text_by_delimiters(
            content,
            delimiters=["\n\n", "\n", ". ", " "],
            target_size=self.config.chunk_size,
            overlap=self.config.chunk_overlap,
        )

        total = max(1, len(segments))
        return [
            self._build_chunk(doc, seg, doc.start_line, doc.end_line, i, total)
            for i, seg in enumerate(segments)
        ]

    def _chunk_pdf(self, doc: NormalizedDocument) -> list[RAGChunk]:
        content = doc.content.strip()
        # If PDF page fits within chunk_size, keep as 1 page chunk
        if len(content) <= self.config.chunk_size:
            return [self._build_chunk(doc, content, None, None, 0, 1)]

        # Split oversized page text semantically
        segments = self._split_text_by_delimiters(
            content,
            delimiters=["\n\n", "\n", ". ", " "],
            target_size=self.config.chunk_size,
            overlap=self.config.chunk_overlap,
        )

        total = max(1, len(segments))
        return [
            self._build_chunk(doc, seg, None, None, i, total)
            for i, seg in enumerate(segments)
        ]

    def _chunk_text_or_config(self, doc: NormalizedDocument) -> list[RAGChunk]:
        content = doc.content.strip()
        if len(content) <= self.config.chunk_size:
            return [self._build_chunk(doc, content, doc.start_line, doc.end_line, 0, 1)]

        segments = self._split_text_by_delimiters(
            content,
            delimiters=["\n\n", "\n", ";\n", ", ", " "],
            target_size=self.config.chunk_size,
            overlap=self.config.chunk_overlap,
        )

        total = max(1, len(segments))
        return [
            self._build_chunk(doc, seg, doc.start_line, doc.end_line, i, total)
            for i, seg in enumerate(segments)
        ]

    # ---------------------------------------------------------------------------
    # Helper utilities
    # ---------------------------------------------------------------------------

    def _build_chunk(
        self,
        doc: NormalizedDocument,
        content: str,
        start_line: Optional[int],
        end_line: Optional[int],
        index: int,
        total: int,
    ) -> RAGChunk:
        anchor = f"L{start_line}" if start_line is not None else (f"P{doc.page_number}" if doc.page_number is not None else "0")
        chunk_id = generate_deterministic_chunk_id(
            repository_id=doc.repository_id,
            file_path=doc.file_path,
            anchor=anchor,
            chunk_index=index,
            content=content,
        )

        char_cnt = len(content)
        token_cnt = self.config.estimate_tokens(content)

        return RAGChunk(
            chunk_id=chunk_id,
            repository_id=doc.repository_id,
            file_path=doc.file_path,
            file_type=doc.file_type,
            language=doc.language,
            content=content,
            start_line=start_line,
            end_line=end_line,
            page_number=doc.page_number,
            section=doc.section,
            symbol=doc.symbol,
            chunk_index=index,
            total_chunks=total,
            char_count=char_cnt,
            token_count=token_cnt,
            parent_metadata=dict(doc.metadata),
        )

    def _split_text_by_delimiters(
        self,
        text: str,
        delimiters: list[str],
        target_size: int,
        overlap: int,
    ) -> list[str]:
        """Recursively splits text into chunks approximately of target_size with overlap."""
        if len(text) <= target_size:
            return [text] if len(text) >= self.config.min_chunk_size else []

        # Find the highest-priority delimiter that appears in the text
        delim = delimiters[0]
        for d in delimiters:
            if d in text:
                delim = d
                break

        parts = text.split(delim)
        chunks: list[str] = []
        curr = ""

        for part in parts:
            candidate = f"{curr}{delim}{part}" if curr else part
            if len(candidate) <= target_size:
                curr = candidate
            else:
                if curr and len(curr.strip()) >= self.config.min_chunk_size:
                    chunks.append(curr.strip())
                # Handle single parts longer than target_size
                if len(part) > target_size and len(delimiters) > 1:
                    sub_chunks = self._split_text_by_delimiters(part, delimiters[1:], target_size, overlap)
                    chunks.extend(sub_chunks)
                    curr = ""
                else:
                    curr = part

        if curr and len(curr.strip()) >= self.config.min_chunk_size:
            chunks.append(curr.strip())

        return chunks if chunks else [text]
