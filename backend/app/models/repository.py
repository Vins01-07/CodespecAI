from pydantic import BaseModel, HttpUrl
from typing import Optional, Any


class RepoIngestRequest(BaseModel):
    url: str
    branch: Optional[str] = None


class IngestTaskResponse(BaseModel):
    task_id: str
    status: str
    message: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: Optional[dict[str, Any]] = None
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None