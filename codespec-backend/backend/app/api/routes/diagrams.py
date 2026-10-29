"""
Architecture diagram routes — Module 4 placeholder.

Returns 501 Not Implemented until the diagram generation feature is built.
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/diagrams", tags=["diagrams"])


@router.get(
    "/{repo_url:path}/architecture",
    summary="[Module 4] Generate architecture diagram data",
)
async def get_architecture_diagram(repo_url: str) -> JSONResponse:
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "module": "Module 4 — Enterprise Integration & CI/CD",
            "eta": "Months 10–12",
            "description": (
                "This endpoint will return a Cytoscape.js / React Flow compatible "
                "graph payload for rendering interactive architecture diagrams "
                "in the frontend."
            ),
        },
    )


@router.get(
    "/{repo_url:path}/mermaid",
    summary="[Module 4] Export architecture as Mermaid diagram",
)
async def get_mermaid_diagram(repo_url: str) -> JSONResponse:
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "module": "Module 4 — Enterprise Integration & CI/CD",
        },
    )
