"""
Typed models and schemas for CodeSpecAI RAG Phase 6: Hybrid Retrieval.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class RetrievalSourceType(str, Enum):
    """Source channel through which an item was retrieved."""
    VECTOR = "vector"
    GRAPH = "graph"
    HYBRID = "hybrid"


class RetrievalProvenance(BaseModel):
    """
    Detailed audit trail for how a retrieved item was sourced, ranked, and expanded.
    """
    sources: list[str] = Field(
        default_factory=list,
        description="Channels that retrieved this item: 'vector', 'graph', or both ('hybrid')",
    )
    vector_score: Optional[float] = Field(
        None,
        description="Original cosine similarity score from vector search (0.0 to 1.0)",
    )
    vector_rank: Optional[int] = Field(
        None,
        description="1-based original rank in vector similarity search",
    )
    graph_score: Optional[float] = Field(
        None,
        description="Computed relevance score from graph expansion (0.0 to 1.0)",
    )
    graph_rank: Optional[int] = Field(
        None,
        description="1-based original rank in graph retrieval",
    )
    graph_relationships: list[str] = Field(
        default_factory=list,
        description="Relationships connecting this item to seed entities (e.g. CALLS, EXTENDS)",
    )
    focal_seed: Optional[str] = Field(
        None,
        description="Symbol or file that triggered this item's graph expansion",
    )


class RetrievedItem(BaseModel):
    """
    A single ranked, deduplicated piece of repository context with content and provenance.
    """
    id: str = Field(..., description="Unique chunk ID or graph entity ID")
    repository_id: str = Field(..., description="Repository ID ensuring tenant isolation")
    file_path: str = Field(..., description="Normalized repository-relative file path")
    symbol: Optional[str] = Field(None, description="AST symbol name or identifier if applicable")
    file_type: str = Field("source_code", description="File type classification")
    content: str = Field(..., description="Text content, code snippet, or formatted structural context")
    start_line: Optional[int] = Field(None, description="1-indexed starting line number")
    end_line: Optional[int] = Field(None, description="1-indexed ending line number")
    page_number: Optional[int] = Field(None, description="1-indexed page number for PDF documents")
    section: Optional[str] = Field(None, description="Heading hierarchy or config section")
    score: float = Field(..., description="Final merged ranking score (higher is more relevant)")
    rank: int = Field(1, description="1-based final rank position in results")
    provenance: RetrievalProvenance = Field(..., description="Source origin and scoring breakdown")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Additional context metadata")


class HybridRetrievalConfig(BaseModel):
    """
    Configuration parameters for hybrid vector and graph retrieval.
    """
    top_k: int = Field(10, description="Maximum number of final ranked items to return")
    vector_top_k: int = Field(10, description="Number of candidates to retrieve from vector store")
    vector_min_score: float = Field(0.0, description="Minimum cosine similarity cutoff for vector search")
    include_graph_expansion: bool = Field(True, description="Whether to expand top vector hits in the code graph")
    graph_expansion_depth: int = Field(1, description="Traversal hop depth for Neo4j neighbor expansion (1-3)")
    graph_limit_per_seed: int = Field(10, description="Max graph entities to retrieve per seed symbol or file")
    ranking_strategy: str = Field("rrf", description="Fusion ranking strategy: 'rrf' or 'weighted'")
    vector_weight: float = Field(0.6, description="Weight given to vector score in weighted ranking")
    graph_weight: float = Field(0.4, description="Weight given to graph score in weighted ranking")
    rrf_k: int = Field(60, description="Smoothing constant k for Reciprocal Rank Fusion")


class RetrievalResult(BaseModel):
    """
    Complete response payload from HybridRetriever.query().
    Contains ranked items and operational diagnostic counts.
    """
    query: str = Field(..., description="The user query processed")
    repository_id: str = Field(..., description="Repository isolation scope")
    items: list[RetrievedItem] = Field(default_factory=list, description="Ranked context items")
    total_results: int = Field(0, description="Total number of items returned")
    vector_hit_count: int = Field(0, description="Raw candidates returned by vector search")
    graph_hit_count: int = Field(0, description="Raw candidates returned by graph expansion")
    fused_hybrid_count: int = Field(0, description="Number of items identified by both vector and graph")
    strategy_used: str = Field("rrf", description="Ranking strategy applied for result fusion")

    def to_context_string(self, max_tokens: Optional[int] = None) -> str:
        """
        Format retrieved items into a structured Markdown string suitable for prompt context.
        """
        if not self.items:
            return f"No relevant context found for query '{self.query}' in repository '{self.repository_id}'."

        sections: list[str] = [
            f"# Retrieved Codebase Context for '{self.query}' (Repo: {self.repository_id})\n"
        ]

        for item in self.items:
            header_parts = [f"### [{item.rank}] `{item.file_path}`"]
            if item.symbol:
                header_parts.append(f"— Symbol: `{item.symbol}`")
            if item.start_line is not None and item.end_line is not None:
                header_parts.append(f"(Lines {item.start_line}–{item.end_line})")
            
            src_str = ", ".join(item.provenance.sources)
            header_parts.append(f"[{src_str}, Score: {item.score:.4f}]")
            sections.append(" ".join(header_parts))

            if item.provenance.graph_relationships:
                rels_str = ", ".join(item.provenance.graph_relationships)
                sections.append(f"> Graph connections: {rels_str}")

            sections.append(f"```{item.metadata.get('language') or ''}\n{item.content.strip()}\n```\n")

        full_text = "\n".join(sections)
        return full_text
