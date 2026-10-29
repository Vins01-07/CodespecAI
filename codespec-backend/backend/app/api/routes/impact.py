"""Graph-based impact analysis API."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_impact_service
from app.core.impact.service import (
    EntityNotFoundError,
    ImpactService,
    ImpactStorageError,
)
from app.models.impact import ImpactAnalysisRequest, ImpactAnalysisResponse

router = APIRouter(prefix="/impact", tags=["impact"])


@router.post(
    "/analyze",
    response_model=ImpactAnalysisResponse,
    summary="Analyze dependencies and potentially affected entities",
)
async def analyze_impact(
    body: ImpactAnalysisRequest,
    service: ImpactService = Depends(get_impact_service),
) -> ImpactAnalysisResponse:
    try:
        return service.analyze(
            repo_url=body.repo_url,
            entity_kind=body.entity_kind,
            entity_id=body.entity_id,
            max_depth=body.max_depth,
            limit=body.limit,
        )
    except EntityNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except ImpactStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Impact graph is temporarily unavailable",
        ) from exc
