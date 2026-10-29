"""Pydantic validation schemas for vector payloads and point metadata."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ChunkPayloadSchema(BaseModel):
    """Strict schema for Qdrant payload items to ensure data integrity and multi-tenant security."""

    repository_id: str = Field(..., min_length=1, description="SHA-256 hashed repository identifier")
    file_path: str = Field(..., min_length=1, description="Repository-relative file path")
    entity_id: str | None = Field(default=None, description="Path-qualified symbol identifier")
    entity_name: str | None = Field(default=None, description="Extracted entity name")
    entity_type: str | None = Field(default=None, description="Entity type: function, class, file, etc.")
    language: str | None = Field(default=None, description="Source programming language")
    start_line: int = Field(default=1, ge=1, description="1-indexed starting line")
    end_line: int = Field(default=1, ge=1, description="1-indexed ending line")
    chunk_index: int = Field(default=0, ge=0, description="Sequential index within file/entity")
    content_hash: str | None = Field(default=None, description="Content hash of the chunk text")
    file_revision: str | None = Field(default=None, description="Git commit hash or file revision tag")
    text: str = Field(..., min_length=1, description="Extracted source snippet or markdown text")

    model_config = ConfigDict(extra="ignore")
