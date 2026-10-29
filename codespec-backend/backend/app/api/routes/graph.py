"""
Graph query routes.

GET /graph/{repo_url}/nodes          — all nodes for a repo (paginated)
GET /graph/{repo_url}/edges          — all relationships for a repo
GET /graph/{repo_url}/file/{path}    — sub-graph for a single file
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from urllib.parse import unquote

from app.api.deps import get_graph_builder
from app.core.graph.builder import GraphBuilder

router = APIRouter(prefix="/graph", tags=["graph"])


def _decode(raw: str) -> str:
    """URL-decode a path/URL segment passed as a path parameter."""
    return unquote(raw)


@router.get(
    "/{repo_url:path}/nodes",
    summary="Get all graph nodes for a repository",
)
async def get_nodes(
    repo_url: str,
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(500, ge=1, le=2000, description="Max nodes to return"),
    builder: GraphBuilder = Depends(get_graph_builder),
) -> list[dict]:
    """
    Return Function and Class nodes belonging to `repo_url`, paginated.

    `repo_url` should be the exact URL used during ingestion (URL-encoded in path).
    """
    url = _decode(repo_url)
    try:
        return builder.get_repo_nodes(url, skip=skip, limit=limit)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.get(
    "/{repo_url:path}/edges",
    summary="Get all relationships for a repository",
)
async def get_edges(
    repo_url: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=5000),
    builder: GraphBuilder = Depends(get_graph_builder),
) -> list[dict]:
    """Return CALLS, IMPORTS, DEFINES, HAS_METHOD edges for `repo_url`."""
    url = _decode(repo_url)
    try:
        return builder.get_repo_edges(url, skip=skip, limit=limit)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.get(
    "/{repo_url:path}/file/{file_path:path}",
    summary="Get sub-graph for a single file",
)
async def get_file_subgraph(
    repo_url: str,
    file_path: str,
    builder: GraphBuilder = Depends(get_graph_builder),
) -> dict:
    """
    Return the nodes and edges scoped to a single file within a repository.

    Useful for rendering a per-file dependency view in the frontend.
    """
    url = _decode(repo_url)
    path = _decode(file_path)
    try:
        return builder.get_file_subgraph(url, path)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
