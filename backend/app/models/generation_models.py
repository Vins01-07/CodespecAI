"""
Typed models and schemas for CodeSpecAI RAG Phase 7 & 8: LLM Generation and End-to-End RAG.
"""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field

from app.models.retrieval_models import RetrievalResult


class Citation(BaseModel):
    """
    Structured citation reference mapping generated answers back to source code/docs.
    """
    index: int = Field(..., description="1-based citation index (e.g. 1 for [1])")
    file_path: str = Field(..., description="Repository-relative file path")
    symbol: Optional[str] = Field(None, description="AST symbol name or identifier if applicable")
    start_line: Optional[int] = Field(None, description="Starting line number")
    end_line: Optional[int] = Field(None, description="Ending line number")
    snippet: str = Field(..., description="Relevant code or text excerpt")
    score: float = Field(0.0, description="Retrieval score of the referenced item")
    sources: list[str] = Field(default_factory=list, description="Retrieval channels (vector, graph)")
    page_number: Optional[int] = Field(None, description="PDF page number if applicable")
    section: Optional[str] = Field(None, description="Section heading breadcrumb if applicable")


class RAGSourceItem(BaseModel):
    """
    Structured source item preserving complete provenance for every context unit.
    """
    index: int = Field(..., description="1-based index (e.g. 1 for [1])")
    repository_id: str = Field(..., description="Repository isolation ID")
    file_path: str = Field(..., description="Repository-relative file path")
    file_type: str = Field("source_code", description="File type classification")
    symbol: Optional[str] = Field(None, description="AST symbol name or identifier if applicable")
    start_line: Optional[int] = Field(None, description="1-indexed starting line number")
    end_line: Optional[int] = Field(None, description="1-indexed ending line number")
    page_number: Optional[int] = Field(None, description="1-indexed PDF page number")
    section: Optional[str] = Field(None, description="Documentation heading or config section")
    snippet: str = Field(..., description="Relevant code or text excerpt")
    score: float = Field(0.0, description="Retrieval fusion score")
    sources: list[str] = Field(default_factory=list, description="Retrieval channels ('vector', 'graph')")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional context metadata")


class LLMResponse(BaseModel):
    """
    Raw response returned by an LLM provider.
    """
    content: str = Field(..., description="Generated text answer")
    model: str = Field(..., description="Model name or identifier used")
    provider: str = Field(..., description="Provider name (mock, openai, gemini, ollama)")
    prompt_tokens: Optional[int] = Field(None, description="Number of tokens in the prompt")
    completion_tokens: Optional[int] = Field(None, description="Number of tokens generated")
    total_tokens: Optional[int] = Field(None, description="Total tokens consumed")
    finish_reason: Optional[str] = Field(None, description="Completion finish reason (stop, length, etc.)")
    raw_response: Optional[dict[str, Any]] = Field(None, description="Raw provider response payload")


class BuiltContext(BaseModel):
    """
    Formatted prompt context prepared by ContextBuilder for LLM consumption.
    """
    system_prompt: str = Field(..., description="System instructions and persona prompt")
    user_prompt: str = Field(..., description="Formatted user query with numbered context blocks")
    citations: list[Citation] = Field(default_factory=list, description="Extracted citation entries")
    sources: list[RAGSourceItem] = Field(default_factory=list, description="Full provenance source items")
    estimated_tokens: int = Field(0, description="Approximate token count of context")


class RAGMetadata(BaseModel):
    """
    Audit metrics and execution telemetry for an end-to-end RAG query.
    """
    query: str = Field(..., description="Original user query")
    repository_id: str = Field(..., description="Target repository ID")
    total_sources: int = Field(0, description="Total sources included in context")
    vector_hits: int = Field(0, description="Raw candidates returned by vector search")
    graph_hits: int = Field(0, description="Raw candidates returned by graph expansion")
    hybrid_fused: int = Field(0, description="Number of items fused from both channels")
    provider: str = Field(..., description="LLM provider name")
    model: str = Field(..., description="LLM model name")
    tokens_used: Optional[int] = Field(None, description="Total tokens consumed if reported")
    latency_seconds: float = Field(0.0, description="Total elapsed seconds")


class RAGResponse(BaseModel):
    """
    End-to-end RAG response containing the grounded answer, source provenance, and telemetry.
    """
    answer: str = Field(..., description="Generated grounded answer from the LLM")
    sources: list[RAGSourceItem] = Field(default_factory=list, description="Grounded source items with full provenance")
    retrieval_metadata: Optional[RAGMetadata] = Field(None, description="Pipeline telemetry and retrieval metrics")
    is_insufficient_context: bool = Field(False, description="Flag indicating if the retrieved context was insufficient")
    is_successful: bool = Field(True, description="Whether the RAG generation pipeline succeeded")
    error: Optional[str] = Field(None, description="Error message if generation failed")


class GenerationResult(BaseModel):
    """
    Backward-compatible response model for RAG generation.
    """
    answer: str = Field(..., description="Generated answer from the LLM")
    query: str = Field(..., description="Original user query")
    repository_id: str = Field(..., description="Target repository ID")
    citations: list[Citation] = Field(default_factory=list, description="Traceable citations in answer")
    retrieval_result: RetrievalResult = Field(..., description="Underlying Phase 6 retrieval result")
    provider: str = Field(..., description="LLM provider name used")
    model: str = Field(..., description="Model name used")
    tokens_used: Optional[int] = Field(None, description="Total tokens consumed if reported")
    is_successful: bool = Field(True, description="Whether answer generation succeeded")
    error: Optional[str] = Field(None, description="Error message if generation failed")


class ChatRequest(BaseModel):
    """
    Request payload for FastAPI RAG chat endpoint (POST /api/chat).
    """
    repository_id: str = Field(..., description="Unique repository identifier or clone URL")
    query: str = Field(..., description="Natural language question or search query")

    model_config = {
        "json_schema_extra": {
            "example": {
                "repository_id": "https://github.com/example/repo",
                "query": "How does authentication work in this codebase?",
            }
        }
    }


class ChatResponse(BaseModel):
    """
    Response payload for FastAPI RAG chat endpoint (POST /api/chat).
    Preserves grounded answer, source provenance, and telemetry.
    """
    answer: str = Field(..., description="Grounded answer synthesized from codebase context")
    sources: list[RAGSourceItem] = Field(
        default_factory=list,
        description="Preserved source items with full provenance",
    )
    retrieval_metadata: Optional[RAGMetadata] = Field(
        None,
        description="Optional execution telemetry and retrieval metrics",
    )
    is_insufficient_context: bool = Field(
        False,
        description="True if the retrieved context was insufficient to answer the query",
    )

