# LLM Integration Handoff Context

This document describes the backend state for the next developer or AI coding agent. Read it before implementing LLM answer generation. It distinguishes implemented behavior from infrastructure that is present but not yet usable end to end.

## Current State

- Backend source is in `codespec-backend/backend`; Compose configuration is `codespec-backend/docker-compose.yml`.
- The active Git branch at handoff is `new-backend`.
- Module 1 and Module 2 provide repository ingestion, Tree-sitter parsing, a Neo4j structural graph, bounded impact analysis, deterministic code/document chunking, a BGE-M3 embedding adapter, Qdrant storage, and hybrid graph/vector retrieval contracts.
- **LLM answer generation is not implemented.** `POST /api/v1/chat/ask` is a placeholder returning HTTP 501. `POST /api/v1/rag/context` assembles source-grounded context only; it does not call an LLM or produce an answer.
- Host tests and the current standard-dependency Docker image each completed the full backend suite: **50 passed**. Two non-failing warnings remain: a Starlette/httpx TestClient deprecation and a notice that payload indexes are ignored by Qdrant's local in-memory test mode.

## Ingested Repository Evidence

The public repository `https://github.com/RajDalvi08/replicai`, branch `main`, was ingested through the API.

- Ingestion task: `82e8af3a-e29e-42ad-a0cc-ffd538b23148` — `SUCCESS`.
- Git clone completed; **103 of 103 source files parsed**.
- Neo4j graph builder reported 103 files, 461 functions, 103 classes, 226 linked imports, 465 linked calls, 160 instantiations, 284 uses, and 12 inheritance links.
- Stored graph relationships include `CONTAINS`, `DEFINES`, `HAS_METHOD`, `IMPORTS`, `CALLS`, `INSTANTIATES`, `USES`, and `EXTENDS`.
- The Neo4j Browser view was verified at `http://localhost:7474/browser/`. A limited sample query returned 137 nodes and 136 relationships; that is a query limit, not the total graph size.
- The ingestion task separately enqueued semantic indexing as task `d590cc20-c27d-44c5-8c7b-c884d60279f4`. That task is `FAILURE` with `BGE-M3 model could not be loaded`.

**Important:** Neo4j graph ingestion is working for this repository. Semantic indexing is not currently ready. Qdrant is running and its collection initializes, but the repository's vectors were not created because the local embedding runtime/model weights are unavailable. Consequently, live `/retrieval/search` and `/rag/context` cannot yet provide repository results. Do not interpret `/health` reporting `vector_store: ready` as proof the embedding model or repository vector index is ready; that field only reflects the Qdrant collection check.

## Backend Architecture

### Ingestion and parsing

- `app/api/routes/repos.py` exposes Git/ZIP ingestion, indexing dispatch, task polling, and repository listing.
- `app/workers/tasks.py` runs Git/ZIP ingestion, scans and parses the repository, writes the graph, then separately enqueues semantic indexing. A vector-index failure does not roll back a successful graph ingestion.
- `app/core/ingestion/` contains Git fetching, ZIP extraction, scanning, and file filters.
- `app/core/parser/registry.py` dispatches to Tree-sitter parsers. `app/models/parser_models.py` defines file/function/class parse results.
- `app/core/graph/builder.py` writes the parsed entities and structural relationships to Neo4j.

### Graph and impact analysis

- `app/db/neo4j.py` owns the Neo4j driver/session and schema setup; `app/core/graph/neo4j_client.py` exposes graph helpers.
- `app/core/impact/service.py` performs bounded, repository-scoped traversals over actual graph relationships. `app/api/routes/impact.py` exposes `POST /api/v1/impact/analyze`; request/response schemas are in `app/models/impact.py`.
- Graph lookups must use the exact repository key (`repo_url`) as well as the entity ID. Entity IDs are not globally unique across repositories.
- Existing graph edges are structural facts. Semantic similarity or LLM inference must never be reported as an existing dependency edge.

### Chunking, embeddings, vectors, and indexing

- `app/core/chunking/service.py` creates deterministic source-symbol and Markdown chunks with file/entity/line provenance. `app/core/chunking/models.py` defines the internal chunk record.
- `app/core/embeddings/service.py` defines the provider protocol and lazy local BGE-M3 dense-vector implementation. It batches, normalizes vectors, checks dimensions, and honors offline/device/cache settings.
- `app/core/vectors/store.py` owns Qdrant collection/search/upsert/delete operations; `app/core/vectors/indexer.py` embeds bounded batches and reconciles file revisions.
- `app/core/indexing/service.py` scans source plus Markdown incrementally and indexes one file at a time. The scanner's Module 1 behavior remains unchanged.
- `app/core/repository_identity.py` derives a SHA-256 `repository_id` from the trimmed repository key for Qdrant filtering. Neo4j continues to use the original `repo_url` key.
- Qdrant client is constrained to the 1.13.x line to match the Compose server `qdrant/qdrant:v1.13.2`.
- Embedding settings are in `app/config.py` and `backend/.env.example`, including `EMBEDDING_MODEL_PATH`, `EMBEDDING_LOCAL_FILES_ONLY`, `EMBEDDING_DEVICE`, `EMBEDDING_CACHE_DIR`, batch/length limits, Qdrant settings, and indexing limits.
- `requirements-embeddings.txt` adds FlagEmbedding to the base requirements. The default local-only setting means the model weights must be provisioned into the configured cache/path separately; runtime inference will not fetch them automatically.

### Retrieval and RAG context

- `app/core/retrieval/graph.py` retrieves repository-scoped structural evidence from Neo4j.
- `app/core/retrieval/service.py` embeds a query, performs repository-filtered Qdrant search, links hits to exact graph entities, expands bounded graph evidence, fuses ranks with Reciprocal Rank Fusion, and assembles a character-bounded context.
- `app/models/retrieval.py` defines the request and response contracts.
- `app/api/routes/retrieval.py` exposes `POST /api/v1/retrieval/search`; `app/api/routes/rag.py` exposes `POST /api/v1/rag/context`. Both currently invoke the same retrieval service and return evidence/context, not generated prose.
- Semantic and graph evidence remain distinct in responses. Context citations include chunk ID, file path, entity, language, start/end lines, source text, semantic score/rank, graph rank/path, fusion rank/score, and truncation information.

## API Contracts

Base prefix is `/api/v1`; interactive API docs are at `/docs`.

Repository ingestion:

```http
POST /api/v1/repos/ingest/git
Content-Type: application/json
```

```json
{
  "repo_url": "https://github.com/owner/repository",
  "branch": "main"
}
```

The response includes a Celery `task_id`; poll `GET /api/v1/repos/task/{task_id}` until `SUCCESS` or `FAILURE`. A successful ingestion result can include a separate `semantic_index_task_id`; poll that independently because graph ingestion and vector indexing have separate outcomes.

Grounded retrieval input:

```http
POST /api/v1/rag/context
Content-Type: application/json
```

```json
{
  "repo_url": "https://github.com/owner/repository",
  "query": "Where is authentication configured?",
  "top_k": 8,
  "graph_depth": 1,
  "max_context_chars": 12000
}
```

Bounds are enforced by `HybridRetrievalRequest`: query up to 4000 characters, `top_k` 1-50, graph depth 0-4, and context budget 100-200000 characters. Response fields are `repository_id`, `query_id`, `items`, `graph_evidence`, and `truncated`. Each item carries source `text` and provenance. A retrieval/model/vector/graph outage maps to HTTP 503; invalid input maps to 400.

Other relevant routes:

- `POST /api/v1/retrieval/search`: current hybrid retrieval endpoint, same request/response contract as grounded context.
- `POST /api/v1/impact/analyze`: bounded graph dependency and affected-dependent analysis.
- `POST /api/v1/repos/index`: schedule indexing for an already ingested repo.
- `GET /api/v1/repos/task/{task_id}`: poll ingestion/indexing task status.
- `GET /health`: API and Qdrant collection health summary; it does not check BGE-M3 weights.
- `POST /api/v1/chat/ask`: **501 placeholder**. Its current handler accepts a simple `query` parameter; create/confirm a typed JSON contract before implementation rather than assuming it already accepts the RAG request schema.
- `POST /api/v1/chat/sync-docs`: **501 placeholder**, outside the LLM-answer task unless explicitly requested.

## Guidance for the LLM Implementation Agent

1. Keep the existing retrieval layer responsible for finding evidence. The LLM layer should consume `HybridRetrievalResponse`/`ContextItem` data (or call the existing retrieval service through an explicit service boundary); it should not duplicate Neo4j/Qdrant queries or reimplement ranking.
2. Preserve source provenance through generation. Every code-specific factual claim should cite the returned file path and line range. Never fabricate citations, claim vector similarity proves a dependency, or merge graph evidence with semantic evidence as though they were the same thing.
3. Keep `/api/v1/rag/context` as a context-only contract unless an intentional API change is agreed. Implement generated answers behind a separate typed service/route or deliberately evolve the chat placeholder with request/response models and tests.
4. Handle empty context, truncated context, retrieval HTTP 503/model outage, provider timeout, malformed model output, and token/context limits explicitly. Do not return a confident codebase answer when retrieval supplied no evidence.
5. Keep provider selection and credentials in environment configuration. Do not hard-code API keys, send source code to a hosted LLM without an explicit product/privacy decision, or log source text, user queries, secrets, vectors, or full prompts.
6. Repository filtering is not user authorization. The backend currently has no auth/tenant access-control layer. Do not expose repository-sensitive routes publicly without authorization in front of them.
7. Avoid rewriting Module 1 parsing, symbol IDs, GraphBuilder, graph schema, or the existing retrieval contracts as part of LLM integration. Add focused service/API tests and preserve the 50-test backend regression suite.
8. No LLM vendor/model, streaming format, conversation memory, tool-calling policy, or answer schema has been selected yet. Treat those as product decisions; do not invent a provider or persistent chat behavior without documenting the choice.

## Run and Verify

From `codespec-backend`:

```powershell
# Configure local environment from the example (review values first; do not commit .env)
Copy-Item backend/.env.example backend/.env

# Start services after Docker Desktop is running
docker compose up --build -d
docker compose ps

# Run the full backend suite
Set-Location backend
python -m pytest -q --tb=short
```

For semantic retrieval, also ensure the embedding-worker image includes the `requirements-embeddings.txt` dependency group and the BGE-M3 weights are available at the configured local path/cache. Then re-index the repository with `POST /api/v1/repos/index`, poll its task, and verify Qdrant contains repository-scoped points before testing `/rag/context`. The ingestion task's current vector-index failure is the concrete blocker to resolve first.

## Local Runtime and Security Notes

- The backend `.env` was absent during verification. API and worker test containers were launched with explicit local development environment values; the data services (Neo4j, Redis, Qdrant) were running through Docker Compose.
- Compose currently includes a development Neo4j credential literal and publishes Neo4j/Redis ports locally. Do not use those development settings as production security configuration.
- Code chunks are stored as payload text in Qdrant. Treat Qdrant storage and backups as proprietary source-code data.
- Detailed verification transcripts and ingestion task responses are under `codespec-backend/backend/test-reports/`, including `handoff-host-suite.txt`, `handoff-docker-suite.txt`, `replicai-ingestion-status.json`, and the semantic task status queried during this handoff.
