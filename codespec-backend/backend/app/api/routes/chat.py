"""
Chat / RAG routes — Module 3 placeholder.

Returns 501 Not Implemented until the doc-sync LLM agent is built.
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post(
    "/ask",
    summary="[Module 3] Ask a question about the codebase",
)
async def ask(query: str) -> JSONResponse:
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "module": "Module 3 — Active Documentation Sync",
            "eta": "Months 7–9",
            "description": (
                "This endpoint will accept natural-language questions about the "
                "codebase and return RAG-powered answers grounded in the parsed "
                "AST graph and vector-embedded documentation."
            ),
        },
    )


@router.post(
    "/sync-docs",
    summary="[Module 3] Trigger documentation sync for a repository",
)
async def sync_docs(repo_url: str) -> JSONResponse:
    return JSONResponse(
        status_code=501,
        content={
            "status": "not_implemented",
            "module": "Module 3 — Active Documentation Sync",
        },
    )
