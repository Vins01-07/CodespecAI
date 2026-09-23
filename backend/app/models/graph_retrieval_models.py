"""
Typed models and schemas for CodeSpecAI RAG Phase 5: Graph-aware Retrieval.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class GraphRelationshipType(str, Enum):
    """Supported graph relationship types for normalization and filtering."""
    # Calls
    CALLS = "CALLS"
    CALLED_BY = "CALLED_BY"
    
    # Class hierarchy and structure
    EXTENDS = "EXTENDS"
    EXTENDED_BY = "EXTENDED_BY"
    HAS_METHOD = "HAS_METHOD"
    METHOD_OF = "METHOD_OF"
    
    # Dependencies
    USES = "USES"
    USED_BY = "USED_BY"
    INSTANTIATES = "INSTANTIATES"
    INSTANTIATED_BY = "INSTANTIATED_BY"
    
    # File structure & modules
    DEFINES = "DEFINES"
    DEFINED_IN = "DEFINED_IN"
    IMPORTS = "IMPORTS"
    IMPORTED_BY = "IMPORTED_BY"
    CONTAINS = "CONTAINS"
    CONTAINED_IN = "CONTAINED_IN"


class GraphNodeEntity(BaseModel):
    """Normalized representation of a node in the CodeSpecAI code graph."""
    id: str = Field(..., description="Unique symbol ID or file path in the graph")
    name: str = Field(..., description="Entity name (function name, class name, or filename)")
    type: str = Field(..., description="Entity node type: Function, Class, File, Repository, etc.")
    file_path: Optional[str] = Field(None, description="Repository-relative file path where the entity is located")
    line_start: Optional[int] = Field(None, description="Starting line number")
    line_end: Optional[int] = Field(None, description="Ending line number")
    docstring: Optional[str] = Field(None, description="Docstring or comment header if available")
    signature: Optional[str] = Field(None, description="Parameters, return type, or type signature")
    properties: dict[str, Any] = Field(default_factory=dict, description="Additional raw properties from the graph node")


class GraphRetrievalResult(BaseModel):
    """
    Normalized retrieval item returned by GraphRetriever.
    Represents a relationship connecting a source symbol/file to a related entity.
    """
    repository_id: str = Field(..., description="Repository identifier / URL for multi-tenant isolation")
    file_path: Optional[str] = Field(None, description="Source file path of the query or focal entity")
    symbol: Optional[str] = Field(None, description="Source symbol or focal query entity")
    relationship: str = Field(..., description="Normalized relationship (e.g. CALLS, DEFINES, EXTENDS)")
    direction: str = Field("outgoing", description="Direction relative to focal entity: outgoing, incoming, or bidirectional")
    depth: int = Field(1, description="Graph traversal hop distance from the focal entity")
    related_entity: GraphNodeEntity = Field(..., description="The target or source entity connected by the relationship")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Useful source metadata (e.g. caller line, file language)")


class GraphContextSummary(BaseModel):
    """
    High-level aggregation of graph retrieval results for a focal symbol or file.
    Provides structured helper queries and text rendering.
    """
    repository_id: str
    focal_symbol: Optional[str] = None
    focal_file: Optional[str] = None
    results: list[GraphRetrievalResult] = Field(default_factory=list)

    def get_calls(self) -> list[GraphRetrievalResult]:
        """Outgoing calls from this symbol."""
        return [r for r in self.results if r.relationship == GraphRelationshipType.CALLS.value]

    def get_callers(self) -> list[GraphRetrievalResult]:
        """Incoming calls to this symbol."""
        return [r for r in self.results if r.relationship == GraphRelationshipType.CALLED_BY.value]

    def get_dependencies(self) -> list[GraphRetrievalResult]:
        """Class usages, instantiations, and parent classes."""
        dep_rels = {
            GraphRelationshipType.USES.value,
            GraphRelationshipType.INSTANTIATES.value,
            GraphRelationshipType.EXTENDS.value,
        }
        return [r for r in self.results if r.relationship in dep_rels]

    def get_defined_symbols(self) -> list[GraphRetrievalResult]:
        """Symbols defined in the focal file."""
        return [r for r in self.results if r.relationship == GraphRelationshipType.DEFINES.value]

    def get_imports(self) -> list[GraphRetrievalResult]:
        """Files imported by the focal file."""
        return [r for r in self.results if r.relationship == GraphRelationshipType.IMPORTS.value]

    def to_text_summary(self) -> str:
        """Render a readable Markdown summary of the structural context for prompt augmentation."""
        lines = []
        header = f"### Code Graph Context: {self.focal_symbol or self.focal_file or self.repository_id}"
        lines.append(header)

        if not self.results:
            lines.append("No related graph entities discovered.")
            return "\n".join(lines)

        grouped: dict[str, list[str]] = {}
        for r in self.results:
            entity_str = f"`{r.related_entity.name}` ({r.related_entity.type})"
            if r.related_entity.file_path:
                entity_str += f" in `{r.related_entity.file_path}`"
            if r.related_entity.line_start:
                entity_str += f":{r.related_entity.line_start}"
            grouped.setdefault(r.relationship, []).append(entity_str)

        for rel, entities in sorted(grouped.items()):
            lines.append(f"- **{rel}**:")
            for ent in entities:
                lines.append(f"  - {ent}")

        return "\n".join(lines)
