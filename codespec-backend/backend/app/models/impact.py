"""Pydantic request and response contracts for graph impact analysis."""

from typing import Literal

from pydantic import BaseModel, Field

from app.config import settings


class ImpactAnalysisRequest(BaseModel):
    repo_url: str = Field(..., min_length=1, max_length=2048)
    entity_kind: Literal["function", "class", "file"]
    entity_id: str = Field(..., min_length=1, max_length=2048)
    max_depth: int = Field(default=settings.IMPACT_MAX_DEPTH, ge=1, le=8)
    limit: int = Field(default=settings.IMPACT_MAX_RESULTS, ge=1, le=1000)


class ImpactEntity(BaseModel):
    id: str
    kind: str
    name: str | None = None
    file_path: str | None = None
    line_start: int | None = None
    line_end: int | None = None


class ImpactEntry(BaseModel):
    entity: ImpactEntity
    depth: int = Field(ge=1)
    relationship_path: list[str]
    entity_path: list[str]


class ImpactAnalysisResponse(BaseModel):
    repository_id: str
    root: ImpactEntity
    direct_dependencies: list[ImpactEntry]
    transitive_dependencies: list[ImpactEntry]
    affected_dependents: list[ImpactEntry]
    max_depth: int
    truncated: bool