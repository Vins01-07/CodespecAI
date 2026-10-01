"""
Repository ingestion routes.

POST /repos/ingest/git   — dispatch git ingestion Celery task
POST /repos/ingest/zip   — upload + dispatch zip ingestion Celery task
GET  /repos/task/{id}    — poll Celery task status
GET  /repos/             — list all ingested repositories
"""
from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from celery.result import AsyncResult
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.api.deps import get_graph_builder
from app.config import settings
from app.core.graph.builder import GraphBuilder
from app.models.repository import (
    IngestTaskResponse,
    RepoIngestRequest,
    TaskStatusResponse,
)
from app.workers.tasks import ingest_git_repo, ingest_zip_repo

router = APIRouter(prefix="/repos", tags=["repositories"])


@router.post(
    "/ingest/git",
    response_model=IngestTaskResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest a git repository",
)
async def ingest_git(
    body: RepoIngestRequest,
) -> IngestTaskResponse:
    """
    Dispatch an asynchronous Celery task to clone and parse a git repository.

    Returns the task ID immediately. Poll `/repos/task/{task_id}` for status.
    """
    task = ingest_git_repo.delay(body.repo_url, body.branch or "main")
    return IngestTaskResponse(task_id=task.id, status="PENDING")


@router.post(
    "/ingest/zip",
    response_model=IngestTaskResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest a ZIP archive upload",
)
async def ingest_zip(
    repo_name: str,
    file: UploadFile = File(..., description="ZIP archive of the repository"),
) -> IngestTaskResponse:
    """
    Upload a ZIP archive and dispatch an async Celery task to parse it.

    The archive is saved to the workspace directory before the task is dispatched.
    """
    workspace = Path(settings.REPO_WORKSPACE_DIR)
    workspace.mkdir(parents=True, exist_ok=True)

    # Save upload to a unique temp path
    unique_name = f"{repo_name}_{uuid.uuid4().hex}.zip"
    zip_path = workspace / unique_name
    try:
        with zip_path.open("wb") as fp:
            shutil.copyfileobj(file.file, fp)
    finally:
        await file.close()

    task = ingest_zip_repo.delay(str(zip_path), repo_name)
    return IngestTaskResponse(task_id=task.id, status="PENDING")


@router.get(
    "/task/{task_id}",
    response_model=TaskStatusResponse,
    summary="Poll ingestion task status",
)
async def get_task_status(task_id: str) -> TaskStatusResponse:
    """
    Poll the status of a Celery ingestion task.

    Possible statuses: PENDING, STARTED, SUCCESS, FAILURE, RETRY.
    The `result` field is populated once the task reaches SUCCESS.
    """
    result = AsyncResult(task_id)
    response = TaskStatusResponse(task_id=task_id, status=result.status)

    if result.successful():
        response.result = result.result
    elif result.failed():
        response.error = str(result.result)

    return response


@router.get(
    "/",
    summary="List all ingested repositories",
)
async def list_repos(
    builder: GraphBuilder = Depends(get_graph_builder),
) -> list[dict]:
    """Return all repositories that have been successfully ingested into Neo4j."""
    try:
        return builder.list_repositories()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Neo4j query failed: {exc}",
        ) from exc
