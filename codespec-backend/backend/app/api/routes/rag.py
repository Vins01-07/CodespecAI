"""Structured grounded-context endpoint; no LLM generation is performed."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_hybrid_retrieval_service
from app.core.retrieval.service import HybridRetrievalService, RetrievalUnavailable
from app.models.retrieval import HybridRetrievalRequest, HybridRetrievalResponse

router = APIRouter(prefix="/rag", tags=["grounded-context"])


@router.post("/context", response_model=HybridRetrievalResponse)
async def build_grounded_context(
    body: HybridRetrievalRequest,
    service: HybridRetrievalService = Depends(get_hybrid_retrieval_service),
) -> HybridRetrievalResponse:
    try:
        return service.search(
            repo_url=body.repo_url,
            query=body.query,
            top_k=body.top_k,
            graph_depth=body.graph_depth,
            max_context_chars=body.max_context_chars,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RetrievalUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Grounded context retrieval is temporarily unavailable",
        ) from exc