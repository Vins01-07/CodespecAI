"""
Pydantic models for repository ingestion API requests and responses.
"""
from typing import Any, Optional
from pydantic import BaseModel, Field


class RepoIngestRequest(BaseModel):
    """Request body for git repository ingestion."""
    repo_url: str = Field(..., description="HTTPS or SSH clone URL of the repository")
    branch: Optional[str] = Field(None, description="Branch to check out (default: main)")


class IngestTaskResponse(BaseModel):
    """Immediate response when an ingestion task is dispatched."""
    task_id: str
    status: str
    message: Optional[str] = None


class TaskStatusResponse(BaseModel):
    """Polling response for an async ingestion task."""
    task_id: str
    status: str  # PENDING | STARTED | SUCCESS | FAILURE | RETRY
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None