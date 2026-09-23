"""
Semantic chunking package for CodeSpecAI RAG Phase 3.
"""
from app.core.rag.chunking.config import (
    ChunkingConfig,
    get_default_chunking_config,
)
from app.core.rag.chunking.service import (
    SemanticChunkingService,
    generate_deterministic_chunk_id,
)

__all__ = [
    "ChunkingConfig",
    "SemanticChunkingService",
    "generate_deterministic_chunk_id",
    "get_default_chunking_config",
]
