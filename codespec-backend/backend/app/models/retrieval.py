"""Contracts for repository-scoped hybrid retrieval and grounded context."""

from typing import Literal

from pydantic import BaseModel, Field

from app.config import settings


class HybridRetrievalRequest(BaseModel):
    repo_url: str = Field(..., min_length=1, max_length=2048)
    query: str = Field(..., min_length=1, max_length=4000)
    top_k: int = Field(default=settings.INDEX_TOP_K, ge=1, le=50)
    graph_depth: int = Field(default=1, ge=0, le=4)
    max_context_chars: int = Field(default=settings.INDEX_MAX_CONTEXT_CHARS, ge=100, le=200000)


class RetrievalGraphPath(BaseModel):
    entity_ids: list[str]
    relationships: list[str]
    directions: list[Literal["outgoing", "incoming"]]
    depth: int = Field(ge=1)


class GraphEvidence(BaseModel):
    entity_id: str
    entity_kind: str
    entity_name: str | None = None
    file_path: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    rank: int = Field(ge=1)
    path: RetrievalGraphPath


class ContextItem(BaseModel):
    chunk_id: str
    repository_id: str
    file_path: str
    entity_id: str
    entity_name: str
    entity_type: str
    language: str
    start_line: int
    end_line: int
    text: str
    semantic_score: float | None = None
    semantic_rank: int | None = None
    graph_rank: int | None = None
    fusion_score: float
    fusion_rank: int = Field(ge=1)
    graph_paths: list[RetrievalGraphPath] = Field(default_factory=list)
    content_truncated: bool = False


class HybridRetrievalResponse(BaseModel):
    repository_id: str
    query_id: str
    items: list[ContextItem]
    graph_evidence: list[GraphEvidence]
    truncated: bool