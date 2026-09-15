"""
Impact prediction routes — Module 2 placeholder.

Returns 501 Not Implemented until the LLM impact predictor is built.
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/impact", tags=["impact"])


@router.get(
    "/{repo_url:path}/function/{function_name}",
    summary="[Module 2] Predict downstream impact of modifying a function",
)
async def predict_impact(repo_url: str, function_name: str) -> JSONResponse:
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "module": "Module 2 — Cognitive LLM & Impact Predictor",
            "eta": "Months 4–6",
            "description": (
                "This endpoint will traverse the Neo4j call graph to identify "
                "all downstream functions/classes affected by changes to "
                f"'{function_name}' and return a risk-scored impact report."
            ),
        },
    )


@router.get(
    "/{repo_url:path}/diff",
    summary="[Module 2] Analyse a git diff for impact",
)
async def analyse_diff(repo_url: str) -> JSONResponse:
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "module": "Module 2 — Cognitive LLM & Impact Predictor",
        },
    )
