"""
CodeSpec AI — FastAPI application entry point.

Startup sequence:
  1. Neo4j schema constraints & indexes created (idempotent)
  2. All API routers mounted under /api/v1

Routes:
  /api/v1/repos/*    — repository ingestion & task polling
  /api/v1/graph/*    — Neo4j graph query endpoints
  /api/v1/impact/*   — [Module 2 stub] LLM impact prediction
  /api/v1/chat/*     — [Module 3 stub] RAG chat
  /api/v1/diagrams/* — [Module 4 stub] architecture diagrams
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.neo4j import init_neo4j_schema
from app.api.routes import repos, graph, impact, chat, diagrams

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """Run startup / shutdown tasks around the application lifecycle."""
    logger.info("CodeSpec AI starting up …")
    try:
        init_neo4j_schema()
        logger.info("Neo4j schema initialised ✓")
    except Exception as exc:
        logger.warning("Neo4j schema init failed (service may not be ready): %s", exc)
    yield
    logger.info("CodeSpec AI shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered codebase intelligence: AST parsing, graph-based dependency "
        "analysis, LLM impact prediction, and automatic documentation sync."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
prefix = settings.API_V1_PREFIX  # "/api/v1"

app.include_router(repos.router,    prefix=prefix)
app.include_router(graph.router,    prefix=prefix)
app.include_router(impact.router,   prefix=prefix)
app.include_router(chat.router,     prefix=prefix)
app.include_router(diagrams.router, prefix=prefix)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "version": "0.1.0"}
