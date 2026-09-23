"""
Typed models and schemas for CodeSpecAI RAG Phase 3: Semantic Chunking.
"""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field

from app.models.classification import FileType


class RAGChunk(BaseModel):
    """
    Retrieval-ready semantic chunk produced from normalized repository content.
    Fully traceable back to its source file, line span, AST symbol, or PDF page.
    """
    chunk_id: str = Field(..., description="Unique deterministic chunk hash identifier")
    repository_id: str = Field(..., description="Repository identifier or clone URL")
    file_path: str = Field(..., description="Normalized relative file path with forward slashes")
    file_type: FileType = Field(..., description="Classification category (source_code, markdown, etc.)")
    language: Optional[str] = Field(None, description="Programming or markup language")
    content: str = Field(..., description="Chunk text content for embedding and retrieval")
    start_line: Optional[int] = Field(None, description="1-indexed starting line number in source file")
    end_line: Optional[int] = Field(None, description="1-indexed ending line number in source file")
    page_number: Optional[int] = Field(None, description="1-indexed page number for PDF documents")
    section: Optional[str] = Field(None, description="Heading breadcrumb, class/function scope, or config section")
    symbol: Optional[str] = Field(None, description="AST symbol identifier when applicable")
    chunk_index: int = Field(0, description="Sequential index of this chunk within its parent document")
    total_chunks: int = Field(1, description="Total number of chunks produced from the parent document")
    char_count: int = Field(0, description="Length of content in characters")
    token_count: int = Field(0, description="Estimated token count of content")
    parent_metadata: dict[str, Any] = Field(default_factory=dict, description="Metadata preserved from parsing")
    embedding: Optional[list[float]] = Field(None, description="Reserved for vector embeddings (Phase 4)")

    model_config = {
        "use_enum_values": True,
        "json_schema_extra": {
            "example": {
                "chunk_id": "c9a4b2e1:auth.py:4:0:f18a",
                "repository_id": "https://github.com/example/repo",
                "file_path": "src/auth.py",
                "file_type": "source_code",
                "language": "python",
                "content": "def validate(token: str) -> bool:\n    return len(token) > 0",
                "start_line": 4,
                "end_line": 5,
                "page_number": None,
                "section": "function validate",
                "symbol": "auth.py::validate",
                "chunk_index": 0,
                "total_chunks": 1,
                "char_count": 59,
                "token_count": 15,
                "parent_metadata": {"return_type": "bool"},
            }
        },
    }

    def to_vector_payload(self) -> dict[str, Any]:
        """Convert chunk into payload suitable for vector databases (Qdrant, Chroma, Neo4j Vector)."""
        return {
            "chunk_id": self.chunk_id,
            "repository_id": self.repository_id,
            "file_path": self.file_path,
            "file_type": self.file_type if isinstance(self.file_type, str) else self.file_type.value,
            "language": self.language,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "page_number": self.page_number,
            "section": self.section,
            "symbol": self.symbol,
            "chunk_index": self.chunk_index,
            "total_chunks": self.total_chunks,
            "char_count": self.char_count,
            "token_count": self.token_count,
            "parent_metadata": self.parent_metadata,
        }


class ChunkingResult(BaseModel):
    """Aggregate result from chunking multiple documents in a repository."""
    repository_id: str
    total_documents_processed: int = 0
    total_chunks_produced: int = 0
    chunks: list[RAGChunk] = Field(default_factory=list)
    chunks_by_type: dict[str, int] = Field(default_factory=dict)
