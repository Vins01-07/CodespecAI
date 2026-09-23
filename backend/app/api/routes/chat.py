"""
Chat / RAG routes — Phase 9 FastAPI Integration.
Exposes the complete end-to-end RAG pipeline via POST /api/chat.
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.api.deps import get_rag_service
from app.core.rag.generation.base import (
    LLMAPIError,
    LLMConfigurationError,
    LLMError,
    LLMTimeoutError,
)
from app.core.rag.generation.rag_service import RAGService
from app.core.rag.retrieval.graph_retriever import (
    GraphConnectionError,
    GraphRetrievalError,
)
from app.models.generation_models import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Query the RAG pipeline for codebase intelligence",
    description=(
        "Accepts a natural-language query and repository ID, runs hybrid retrieval "
        "(vector similarity + Neo4j code graph), constructs structured context, "
        "and synthesizes a grounded answer via LLM with full source provenance."
    ),
)
@router.post(
    "/",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
async def chat_query(
    body: ChatRequest,
    rag_service: RAGService = Depends(get_rag_service),
) -> ChatResponse:
    """
    Thin route handler dispatching user query to the RAG service.
    Validates input parameters and maps pipeline exceptions to standard HTTP statuses.
    """
    # 1. Validate repository_id
    if not body.repository_id or not body.repository_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="repository_id cannot be empty or whitespace only.",
        )
    clean_repo_id = body.repository_id.strip()

    # Reject dangerous path traversal or null byte injections in repository_id
    if ".." in clean_repo_id or clean_repo_id.startswith("/") or "\x00" in clean_repo_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid repository ID format: '{clean_repo_id}'.",
        )

    # 2. Validate query
    if not body.query or not body.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="query cannot be empty or whitespace only.",
        )
    clean_query = body.query.strip()

    # 3. Route -> RAG service only
    try:
        rag_response = rag_service.answer_query(
            query=clean_query,
            repository_id=clean_repo_id,
        )
    except LLMTimeoutError as exc:
        logger.error("LLM timeout during RAG query: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"LLM provider timed out: {exc}",
        ) from exc
    except (LLMAPIError, LLMConfigurationError, LLMError) as exc:
        logger.error("LLM failure during RAG query: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM provider error: {exc}",
        ) from exc
    except (GraphConnectionError, GraphRetrievalError) as exc:
        logger.error("Retrieval failure during RAG query: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Retrieval failure: {exc}",
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error in RAG pipeline: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal RAG pipeline error: {exc}",
        ) from exc

    # 4. Handle non-strict failure reported in RAGResponse
    if not rag_response.is_successful:
        err = rag_response.error or "RAG pipeline execution failed."
        logger.error("RAG pipeline reported failure: %s", err)
        err_lower = err.lower()
        if "retriev" in err_lower or "vector" in err_lower or "graph" in err_lower:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Retrieval failure: {err}",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM failure: {err}",
        )

    # 5. Return grounded response preserving all source provenance
    return ChatResponse(
        answer=rag_response.answer,
        sources=rag_response.sources,
        retrieval_metadata=rag_response.retrieval_metadata,
        is_insufficient_context=rag_response.is_insufficient_context,
    )


# ---------------------------------------------------------------------------
# Backwards-compatible placeholder routes
# ---------------------------------------------------------------------------
@router.post(
    "/ask",
    summary="[Legacy/Module 3] Ask a question about the codebase",
    include_in_schema=False,
)
async def ask_legacy(query: str) -> JSONResponse:
    """Legacy placeholder preserved for backwards compatibility."""
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "message": "Please use POST /api/chat with {'repository_id': '...', 'query': '...'}.",
        },
    )


@router.post(
    "/sync-docs",
    summary="[Module 3] Trigger documentation sync for a repository",
    include_in_schema=False,
)
async def sync_docs(repo_url: str) -> JSONResponse:
    """Placeholder preserved for Module 3 documentation sync."""
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "module": "Module 3 — Active Documentation Sync",
        },
    )
