"""
Configurable parameters for semantic chunking in CodeSpecAI RAG.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class ChunkingConfig(BaseModel):
    """
    Configuration options for semantic content-aware chunking.
    Allows tuning chunk sizes, overlaps, and minimum chunk thresholds.
    """
    # General text, markdown, config, and PDF chunk sizes (in characters)
    chunk_size: int = Field(1000, description="Target chunk size in characters")
    chunk_overlap: int = Field(150, description="Overlap between consecutive chunks in characters")
    min_chunk_size: int = Field(20, description="Minimum characters for a valid non-empty chunk")

    # Source code chunk sizes (gives functions leeway to stay intact)
    code_chunk_size: int = Field(1500, description="Maximum characters for code block before splitting")
    code_chunk_overlap: int = Field(200, description="Line-based overlap when splitting oversized code")

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """
        Estimate token count using standard ~4 chars per token heuristic,
        with fallback to word-count lower bound.
        """
        stripped = text.strip()
        if not stripped:
            return 0
        char_based = len(stripped) // 4
        word_based = int(len(stripped.split()) * 1.3)
        return max(1, (char_based + word_based) // 2)


def get_default_chunking_config() -> ChunkingConfig:
    """Return a default ChunkingConfig instance."""
    return ChunkingConfig()
