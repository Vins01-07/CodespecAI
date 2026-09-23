"""
Typed models and schemas for CodeSpecAI RAG Phase 4: Embeddings and Vector Storage.
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from app.models.chunk_models import RAGChunk


class VectorSearchResult(BaseModel):
    """Result of a repository-scoped vector similarity search."""
    chunk: RAGChunk = Field(..., description="The matched RAG chunk")
    score: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")


class VectorStoreStats(BaseModel):
    """Statistics for vector store index."""
    total_chunks: int = Field(0, description="Total vectors across all repositories in the store")
    repository_chunks: int = Field(0, description="Vectors belonging to the queried repository")
    index_name: str = Field(..., description="Name of the vector index / collection")
    dimensions: int = Field(..., description="Vector dimensionality (e.g. 1536)")


class IndexingResult(BaseModel):
    """Result summary of embedding and indexing chunks into the vector store."""
    repository_id: str
    chunks_indexed: int = Field(0, description="Number of chunks successfully embedded and stored")
    dimensions: int = Field(0, description="Dimensionality of stored vectors")
    provider: str = Field(..., description="Embedding provider used (mock, openai, gemini)")
    index_name: str = Field(..., description="Target vector store index or collection")
    is_successful: bool = True
    error: Optional[str] = None
