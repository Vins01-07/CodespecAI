"""Repository-scoped semantic and graph hybrid retrieval endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_hybrid_retrieval_service
from app.core.retrieval.service import HybridRetrievalService, RetrievalUnavailable
from app.models.retrieval import HybridRetrievalRequest, HybridRetrievalResponse

router = APIRouter(prefix="/retrieval", tags=["retrieval"])


@router.post("/search", response_model=HybridRetrievalResponse)
async def search_repository(
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
            detail="Hybrid retrieval is temporarily unavailable",
        ) from exc