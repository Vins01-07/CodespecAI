# Module 2 Implementation Plan

**Scope:** Impact Analysis Engine, code chunking, BGE-M3 embeddings, Qdrant, graph + vector hybrid retrieval, and a grounded RAG context foundation. This document is the Stage 1 plan only. No production source code has been changed.

## 1. Repository Findings

The backend is in `codespec-backend/backend`; the sibling `codespec-backend/infra/{neo4j,qdrant,ollama}` directories currently contain no files. The backend is a Python 3.12 Docker image running FastAPI, with Celery workers and Redis, and Neo4j 5 as its only configured persistence service. `docker-compose.yml` starts Neo4j, Redis, the API, and a general Celery worker. There is no Qdrant service/client, embedding implementation, chunking service, vector payload, or persisted RAG context contract in the backend.

The root README describes vector retrieval, hybrid RAG, LLMs, and documentation ingestion as implemented. The inspected backend does not contain these components: `chat.py` is a 501 placeholder, the repository scanner only selects source-code extensions, and Qdrant/Ollama infra directories are empty. The README is therefore not a reliable implementation inventory for this plan.

### Existing Module 1 architecture to preserve

- `app/main.py` mounts the `repos`, `graph`, `impact`, `chat`, and `diagrams` routers under `/api/v1`; startup invokes `init_neo4j_schema()`.
- `app/config.py` uses `pydantic-settings` and environment variables. Existing settings cover Redis, Neo4j, workspace path, and API prefix.
- `app/workers/tasks.py` runs the ingestion sequence: `RepoScanner` → `ParserRegistry` → `GraphBuilder.ingest_full_repo`. Git and ZIP ingestion are Celery tasks; Redis is both broker and result backend.
- `RepoScanner` and `filters.py` select `.py`, `.js`, `.jsx`, `.ts`, `.tsx`, `.java`, `.go`, and `.cs`, with a fixed ignored-directory/file set. The scanner does not currently include Markdown or honor repository `.gitignore` files.
- `ParserRegistry` dispatches to six Tree-sitter parsers. `FileSummary` contains normalized relative paths, language, top-level functions, classes, and imports. A `FunctionDef` contains a path-qualified ID, line range, parameters, return type, calls, docstring, class name, instantiations, and uses. A `ClassDef` contains a path-qualified ID, line range, bases, methods, and docstring. IDs are path-based, not repository-qualified; Neo4j scopes them with `repo_url`.
- `GraphBuilder` uses idempotent `MERGE` operations. Its relevant labels/properties are `Repository.url`, `File.repo_url/path/language`, `Function.repo_url/id/name/file_path/class_name/line_start/line_end/parameters/return_type/docstring`, and `Class.repo_url/id/name/file_path/line_start/line_end/bases/docstring`. Relationships include `Repository-[:CONTAINS]->File`, `File-[:DEFINES]->Function|Class`, `Class-[:HAS_METHOD]->Function`, `File-[:IMPORTS]->File`, `Function-[:CALLS]->Function`, `Function-[:INSTANTIATES|USES]->Class`, and `Class-[:EXTENDS]->Class`.
- `app/db/neo4j.py` owns the lazily created Neo4j driver, sessions, and startup constraints/indexes. `app/core/graph/neo4j_client.py` re-exports these helpers. `app/api/deps.py` provides session and `GraphBuilder` dependencies.
- `app/api/routes/graph.py` is read-only graph API access. The current `impact.py` routes return HTTP 501; `chat.py` is also a 501 placeholder and should not become an LLM chat feature in this module.
- API errors are handled locally and sometimes return raw exception text. Logging is Python logging with DEBUG enabled by default. No auth/tenant authorization layer was found.
- `backend/requirements.txt` has FastAPI, Pydantic, Celery/Redis, Neo4j, GitPython, Tree-sitter packages, pytest, and httpx. No Qdrant or ML dependencies exist. `pytest.ini` scopes tests to `backend/tests`, currently containing `test_module1.py`; no lint/type/format configuration was found in the inspected backend.

The test command was attempted with system Python and failed during collection because `neo4j` is not installed. The backend `venv` interpreter could not start because it points to a missing Python 3.10 executable. Thus, the reported 21/21 baseline could not be independently confirmed in this environment; Stage 2 must establish a working test environment and record the real baseline before code changes.

## 2. Module 2 Architecture and Boundaries

```text
Existing scan + Tree-sitter parse
        ├── unchanged GraphBuilder write → Neo4j structural graph
        └── indexable source/docs → deterministic chunks → local BGE-M3
                                                    → Qdrant semantic vectors

Query → Qdrant (repo-filtered semantic evidence)
      → entity linking → Neo4j (repo-filtered structural evidence)
      → evidence fusion/deduplication → structured grounded context
```

- **Neo4j = structural/dependency knowledge.** It remains the source of truth for symbols and explicitly extracted relationships. Do not infer dependencies from vector similarity.
- **Qdrant = semantic/vector knowledge.** It stores vectorized chunks and traceable payload metadata; it does not certify graph relationships.
- **Hybrid retrieval = combined evidence.** Preserve semantic and graph evidence separately, then fuse their ranked results without erasing provenance.
- **RAG = grounded context pipeline for future LLM usage.** Return source-grounded context and evidence metadata only. Do not add LLM generation, conversational intelligence, architecture explanation, or generated reports.

Keep API routes thin. Add business logic in services. Reuse the current Neo4j session factory and exact `repo_url` graph key; do not rewrite GraphBuilder, Tree-sitter extraction, or existing symbol IDs. Derive an opaque deterministic `repository_id` from the exact normalized repository key for Qdrant payload filtering, while retaining the original key only where the existing graph/API contract requires it. Document the normalization rule and test it for Git and `zip://` repository keys.

## 3. Planned Code Changes

### Existing files to modify

- `backend/app/config.py`: add validated settings for Qdrant, collection/vector settings, indexing bounds, and local embedding model/device/cache configuration.
- `backend/app/api/deps.py`: expose injectable embedding, vector-store, impact, and retrieval services through small factories/providers suitable for tests; avoid eagerly loading a model in the API process.
- `backend/app/api/routes/impact.py`: replace the 501 behavior with thin request validation and structured impact-service responses; retain a clear HTTP 404 for an unknown entity and 503 for unavailable graph storage.
- `backend/app/api/routes/repos.py`: add explicit index/status/delete operations or return the downstream indexing task identifier where a repository ingestion schedules indexing. Existing ingestion request/response compatibility must be retained.
- `backend/app/workers/tasks.py`: after a successful graph write, enqueue a distinct indexing task. Add retry-safe index/update/delete tasks. Do not load BGE-M3 during API startup or in ordinary graph-only tasks.
- `backend/app/workers/celery_app.py`: route embedding work to a dedicated queue with bounded concurrency/prefetch; keep Redis JSON serialization and existing task behavior intact.
- `backend/app/main.py`: initialize/health-check Qdrant collection safely at startup without making graph-only API startup dependent on model loading. Preserve Neo4j startup behavior; report vector-store readiness without exposing service internals.
- `backend/requirements.txt` and Docker configuration: add the Qdrant client and isolate the heavy ML runtime as described in Section 12.
- `codespec-backend/docker-compose.yml`: add Qdrant with persistent storage and health check; add a resource-bounded embedding worker and service-name-based configuration. Keep Qdrant and Neo4j ports private to the application network unless explicit local development exposure is configured.

### New backend modules/models

- `backend/app/core/chunking/` (or the closest established `core` package convention): deterministic source-symbol and Markdown chunkers, common chunk identity/provenance helpers.
- `backend/app/core/embeddings/`: an embedding interface and a BGE-M3 local implementation with batching, lazy loading, normalized dense vectors, and explicit device/model settings.
- `backend/app/core/vectors/`: Qdrant client/store adapter, collection initialization, repository-scoped filtering, idempotent upsert/delete/search.
- `backend/app/core/retrieval/`: Neo4j structural retriever, semantic entity linker, hybrid retriever, evidence fusion, and context assembler.
- `backend/app/core/impact/`: bounded graph-based impact analysis service. It may share low-level retrieval utilities but must remain distinct from semantic retrieval.
- `backend/app/models/impact.py`, `chunks.py`, and `retrieval.py` (or a small equivalent grouping): validated API and service contracts described below.
- Focused tests under `backend/tests/` following existing pytest/monkeypatch conventions.

Do not create a second graph builder or dependency database. Prefer new read/query services over expanding `GraphBuilder`, whose current ownership is graph writing and basic graph-list queries.

## 4. Data Contracts

### Chunk and provenance

A `CodeChunk` should carry at least:

- `chunk_id`: deterministic UUID suitable for Qdrant point IDs.
- `repository_id`: opaque deterministic ID derived from the repository key.
- `repo_url`: optional internal-only original graph key; never required in client payloads or logs.
- `file_path`: normalized repository-relative POSIX path.
- `entity_id`, `entity_name`, `entity_type` (`file`, `class`, `function`, `method`, or `doc_section`), where available.
- `language`, `start_line`, `end_line`, `chunk_index`, `content_hash`, and `file_revision`.
- `text`: the chunk text needed for retrieval and future context assembly. Keep it out of logs.

Use immutable service models/dataclasses for internal chunk data and Pydantic models for request/response validation, matching current model conventions. Validate positive line ranges, supported entity types, bounded text length, and non-empty repository/file identity.

### Impact response

Return the requested entity and its kind, exact repository key/ID, direct dependencies, transitive dependencies, affected dependents/blast radius, traversal depth, and explicit provenance for each result (relationship type, direction, path/depth, entity IDs, file paths, and source line ranges where available). Include truncation/limit metadata. Do not return a risk score presented as factual evidence.

### Retrieval and RAG context response

Return `repository_id`, the query ID (not necessarily query text), ranked context items, and a provenance/evidence list. Each item identifies source chunk, file, symbol/entity, language, line range, and source text; semantic score/rank and graph path/relationship evidence remain separate fields. Include fusion rank/score and a truncation indicator. This is a data contract for a later LLM layer, not an answer-generation API.

## 5. Code Chunking

Use source files already scanned and parsed by Module 1, then read file contents only as needed and process one file at a time. Do not retain full repository contents in memory.

- Primary source boundaries are top-level functions and class methods, using parser-provided line ranges and IDs. Include a concise symbol/class header and available signature/docstring as context.
- Avoid indexing a complete class body in addition to all its methods. Emit a compact class overview (name, bases, docstring and declaration context) plus method chunks; for classes with no methods, use a class chunk. Add file-level chunks only for meaningful uncovered module content such as imports/module documentation, rather than duplicating every symbol body.
- Split oversized functions/methods deterministically by line/character limits, retaining the symbol header and bounded overlap. Never exceed configured maximum chunk characters/tokens. Preserve stable order and line spans.
- Add Markdown section chunking for `.md` files (heading hierarchy retained in each chunk, oversized sections split on paragraph/line boundaries). Initially support `.md`; add other documentation extensions only behind explicit scanner/config decisions and tests.
- The existing scanner ignores docs. Implement separate indexable-file discovery or a non-breaking scanner method; do not change `scan()` behavior used by Module 1. Respect the existing ignored-directory rules and enforce repository-root containment before reading paths.

Construct identity from a versioned canonical tuple: `repository_id + normalized file_path + entity_id-or-section-anchor + chunk_index`. Use UUIDv5 for the Qdrant point ID. Store a content hash separately for change detection. Do not put content hash alone in the ID: an edit would create a new point and leave the old point behind. Bump an explicit chunker/identity version if identity semantics change.

## 6. BGE-M3 Embedding Pipeline

Use a small `EmbeddingProvider` protocol and a `BGEM3EmbeddingProvider` backed by FlagEmbedding's BGE-M3 model. The implementation should support `encode` over bounded batches, use dense embeddings for the initial Qdrant collection, normalize vectors consistently with cosine distance, and enforce a maximum sequence length/truncation policy. Keep model loading lazy and scoped to the embedding worker process.

Default to local/private inference: do not send code or queries to a hosted embedding API. Configure a local model path/cache and offline-only mode by default; document an explicit, separate provisioning step to download model weights if needed. Model downloads are not runtime repository-content uploads. Never log source text, query content, model vectors, secrets, credentials, or sensitive repository identifiers.

Resource controls: configurable batch size, maximum chunk length, worker concurrency (initially one model worker per assigned device), CPU/GPU selection, model cache path, and bounded task payloads. Pass file/repository references or chunk batches between tasks instead of serializing an entire repository or all source text into Redis. Treat OOM/model initialization failures as explicit task failures with safe retry/backoff rules; do not retry deterministic bad input indefinitely.

## 7. Qdrant Collection and Indexing

Create one configurable collection (default `codespec_chunks`) with a named dense vector (`dense`, size 1024 for BGE-M3 dense output, cosine distance). Validate configured vector size against the model output before upsert. Create payload indexes for `repository_id`, `file_path`, `entity_id`, `entity_type`, and `file_revision` as supported by the installed client/server versions. Collection initialization must be idempotent and must fail safely on incompatible existing vector configuration; never silently delete/recreate production collections.

Each point payload contains the chunk/provenance contract in Section 4. All semantic queries must include a mandatory exact `repository_id` filter. Never query globally and filter results afterward. For deployments requiring hard tenant boundaries rather than repository-level logical isolation, use separate Qdrant credentials/collections or instances; the current backend has no authorization/tenant system, so Module 2 cannot claim user-level access control.

Indexing flow:

1. Receive repository key and task generation; scan supported source and documentation paths incrementally.
2. Parse source with the existing `ParserRegistry`; reuse Module 1 IDs/line spans, without changing parser output.
3. Chunk one file at a time; compute file revision/content hashes and deterministic chunk IDs.
4. Embed bounded batches; validate vector count, dimension, finite values, and metadata before upsert.
5. Upsert current file chunks with the new `file_revision`; after successful upsert, delete stale points filtered by the same `repository_id` and `file_path` whose revision is not current. Serialize work per repository/file or use generation checks so overlapping tasks cannot prune a newer successful index.
6. Mark index task state only after successful reconciliation. A retry of the same generation produces the same point IDs and converges to the same state.
7. For a deleted source file, delete points using both `repository_id` and exact normalized `file_path`; for a deleted repository, delete by exact repository filter. Make explicit deletion endpoints/tasks idempotent.

For full repository reindex, reconcile against the set of successfully processed files and prune only after a complete successful scan. Do not clear a collection/repository up front. On partial parse/embedding failure, keep the prior usable index, report a failed/partial generation, and do not delete old points. The Neo4j graph currently MERGEs nodes/edges but does not reconcile removed source symbols; Module 2 should not silently redesign that Module 1 behavior. Record this limitation and ensure vector reconciliation itself does not create stale duplicate chunks.

## 8. Impact Analysis Traversal

Implement a read-only `ImpactService` using the existing `get_session()` and existing Neo4j properties/IDs. Require repository key plus an exact entity ID/kind; resolve only inside that repository. For a file root, match `File.repo_url/path`; for functions/classes, match `repo_url/id`. Return a not-found result/HTTP 404 when the exact entity is absent.

Report two concepts explicitly:

- **Dependencies of the changed entity:** follow outgoing structural relationships to entities it calls, instantiates, uses, extends, or imports.
- **Potentially affected dependents/blast radius:** reverse-walk relationships from the changed entity to callers, instantiators/users, subclasses, and importing files. For `CALLS`, a changed callee affects upstream callers; for `EXTENDS`, a changed base affects subclasses; for `IMPORTS`, a changed file affects importers. Preserve direction and edge type in every path.

Use an allow-list of existing relationship types (`CALLS`, `INSTANTIATES`, `USES`, `EXTENDS`, `IMPORTS`) and explicitly decide which apply to each root kind. Exclude `DEFINES`/`HAS_METHOD` from dependency blast radius, using them only for symbol/file context when needed. Every path/node must be constrained to the same `repo_url`; do not rely on path-qualified IDs alone. Bound depth (configurable, initial default 3, maximum 8), returned nodes (initial default 200, hard maximum 1000), and query time. Deduplicate by repository-scoped entity ID and retain shortest/representative provenance paths. No APOC dependency is needed.

## 9. Semantic Linking, Hybrid Retrieval, and Context Fusion

1. Validate the requested repository identity and embed the query through the same local BGE-M3 provider.
2. Search Qdrant with mandatory `repository_id` filter and configured top-k/score threshold. Return semantic evidence with original point ID, score, and payload provenance.
3. Link vector chunks to graph entities using their `entity_id` first. For file/document chunks without an entity ID, use exact repo-scoped file paths and conservative exact symbol-name/ID matches from the query. Record linker method and confidence. Do not convert fuzzy or semantic similarity into a graph dependency.
4. Fetch structural context from Neo4j using exact repository-scoped seed IDs. Expand only allow-listed graph relationship types and bounded depth; return graph paths and node provenance. A semantic-only document hit can remain in results without a graph expansion.
5. Fuse candidates using deterministic Reciprocal Rank Fusion (configurable constant and top-k), deduplicate by chunk/entity identity, and keep semantic rank/score distinct from graph rank/path. Graph evidence can add related source entities but cannot overwrite a semantic source's contents or claim a dependency without an actual edge.
6. Assemble a size-bounded grounded context. Deduplicate repeated/overlapping line spans, preserve all citations/provenance, and return `truncated=true` when evidence is omitted. No prompt construction or LLM call is part of this module.

Proposed APIs (versioned under the existing `/api/v1` prefix):

- `POST /api/v1/impact/analyze`: body includes repository selector/key, `entity_id` or file path, entity kind, traversal direction/options, depth, and result limit; response is the structured impact contract.
- `POST /api/v1/retrieval/search`: repository-scoped semantic + graph hybrid search; response is ranked evidence with provenance.
- `POST /api/v1/rag/context`: same retrieval foundation with explicit context budget and structured grounded-context response. This is not `/chat/ask` and returns no generated natural-language answer.
- `POST /api/v1/repos/{repository_id}/index` or ingestion-triggered dispatch: schedule/re-run indexing and return task ID. `GET /api/v1/repos/tasks/{task_id}` reuses the existing Celery status pattern or adds a typed indexing status. Add repository/file vector deletion only if needed by the actual repository lifecycle; all destructive operations require exact repository scope.

Use Pydantic request/response schemas, bounds on every `top_k`, `depth`, and context budget, and stable HTTP behavior: 400 invalid request, 404 unknown repo/entity, 503 unavailable Neo4j/Qdrant/model, 202 task accepted, and safe 500 for unexpected server failures. Never return raw driver exception text, credentials, or infrastructure addresses.

## 10. Celery and Lifecycle

Keep current graph ingestion task semantics intact. After graph ingestion succeeds, dispatch indexing as a separate Celery task/chain so model load or Qdrant failure does not roll back or misreport the completed Module 1 graph write. Expose graph-ingestion and semantic-index status distinctly. Use task IDs, bounded retries with exponential backoff for transient Qdrant/network failures, and no unbounded retries for malformed data or dimension/model mismatch.

Run embedding work on a dedicated `embeddings` queue with initial concurrency 1, prefetch 1, and deployment-configured CPU/memory/GPU limits. Index tasks should stream/iterate files and batches, not send source text or vectors through Redis. Make all operations safe to repeat. On worker shutdown, close model/client resources where supported. API startup may initialize/check the Qdrant collection but should remain able to serve health/graph routes when vector search is degraded; semantic routes should return a clear 503.

## 11. Configuration, Privacy, and Security

Add settings with validated defaults and environment-only overrides; no hard-coded credentials or service addresses:

- `QDRANT_URL`, optional `QDRANT_API_KEY`, `QDRANT_COLLECTION`, `QDRANT_VECTOR_SIZE`, `QDRANT_TIMEOUT_SECONDS`.
- `EMBEDDING_PROVIDER` (initially local BGE-M3), `EMBEDDING_MODEL` or local `EMBEDDING_MODEL_PATH`, `EMBEDDING_LOCAL_FILES_ONLY=true`, `EMBEDDING_DEVICE`, `EMBEDDING_CACHE_DIR`, `EMBEDDING_BATCH_SIZE`, `EMBEDDING_MAX_LENGTH`.
- `INDEX_MAX_CHUNK_CHARS`, `INDEX_CHUNK_OVERLAP_LINES`, `INDEX_BATCH_SIZE`, `INDEX_TOP_K`, `INDEX_SCORE_THRESHOLD`, `INDEX_MAX_CONTEXT_CHARS`, `INDEX_MAX_FILES_PER_TASK` (if useful), and bounded impact depth/node settings.
- `REPO_WORKSPACE_DIR` remains the existing repository root; avoid adding duplicate path settings unless the implementation needs a separate model cache path.

Security/privacy controls:

- No external embedding service by default. Runtime inference and Qdrant traffic stay on configured private infrastructure; model weights are provisioned separately. Disable model auto-download at runtime under offline mode.
- Code text is stored in Qdrant payloads to support retrieval, so Qdrant persistence, backups, network policy, and access credentials must be treated as proprietary source storage. Never expose Qdrant/Neo4j directly to frontend clients.
- Enforce repository-scoped filters in every vector and graph query. Validate repository-relative paths and root containment to prevent path traversal. Limit upload/index file sizes and chunk/query lengths.
- Do not log source, embeddings, queries, credentials, raw repo URLs, or full exception strings. Log task ID, operation, duration, counts, opaque repository ID, and sanitized error category.
- Current Compose uses a hard-coded Neo4j password and the backend defaults to DEBUG; DEBUG CORS allows `*`, and some routes expose exception text. Stage 2 must remove newly introduced secrets, put vector infrastructure on the private network, and avoid making existing production security worse. Addressing existing credentials/CORS globally is outside this Module 2 plan unless the specific config is necessary for the new service; document deployment overrides and any remaining baseline risk.
- No authentication/authorization was found. Repository filtering is not user authorization. Do not advertise multi-tenant security; deployment must put authenticated authorization in front of repository-sensitive endpoints before exposing this API to untrusted users.

## 12. Docker and Dependency Plan

Add `qdrant/qdrant` (pinned supported tag) with a persistent named volume and health check. Configure API and workers using `http://qdrant:6333`; do not publish Qdrant publicly by default. Add an embedding worker on its own queue with resource limits and the shared repository/model-cache volumes as appropriate. Preserve Neo4j, Redis, existing backend, and Celery health/dependency behavior.

Add `qdrant-client` to backend dependencies. BGE-M3 via FlagEmbedding depends on a large PyTorch/Transformers stack; avoid forcing ML weights/dependencies into the API container if practical. Use a dedicated embedding-worker dependency file/build target (for example `requirements-embeddings.txt` including the base requirements plus a tested FlagEmbedding/PyTorch CPU or deployment-specific GPU set) and an embedding worker image/target. Pin compatible versions after install/build/test; do not add alternate vector DBs or redundant embedding frameworks. Update `.env.example` with non-secret setting names/defaults only. Keep credentials out of Compose literals and do not read or rewrite the existing local `.env` in this planning stage.

## 13. Error Handling and Operational Behavior

- Distinguish missing repository/entity from storage outage, model unavailable, invalid vector dimension, and invalid input; map these to stable API errors without leaking exception details.
- Collection mismatch or missing collection should fail health/readiness for vector features and never silently wipe data.
- Validate each embedding batch before Qdrant upsert. On partial file/task failure, preserve the previous successful generation and report partial/failed indexing state; only prune stale points after all replacement chunks for the file/revision are safely upserted.
- Retry only transient connection/timeouts/rate conditions; use bounded exponential backoff and task idempotency. Quarantine/report parser/unsupported-file failures without logging contents.
- Add counters/timings for files/chunks/batches/upserts/deletes and graph candidates, without source text, vector values, raw user query, secrets, or repository URL.

## 14. Testing and Integration Strategy

Preserve all Module 1 tests and first restore a reproducible Python environment. Use fake embedding providers, fake Qdrant client/store, and Neo4j session doubles for unit tests. Add a small number of opt-in integration tests against disposable Neo4j and Qdrant services (Compose profile or CI service); never require production data or download model weights in unit CI.

Minimum Module 2 coverage:

- Impact: direct and transitive outgoing dependencies; reverse affected callers/users/subclasses/importers; relationship direction/provenance; depth and node limits; file/function/class roots; nonexistent entities; repo scoping; Cypher/storage failures.
- Chunking: deterministic IDs and output order; all metadata and exact lines; source methods/classes and no duplicate class/method bodies; oversized splitting/overlap; Markdown heading ancestry; empty/oversized/unreadable files; root containment.
- Embedding: BGE-M3 adapter contract/dimension/normalization; batching; bounded lengths; local/offline configuration; lazy loading; model initialization, OOM, and batch failures.
- Qdrant: safe idempotent collection creation; incompatible configuration; deterministic point IDs; upsert/update/delete; stale generation reconciliation; repeated indexing; partial failure; repository/file isolation; payload provenance and mandatory query filters.
- Retrieval: semantic result traceability; exact entity linking and unknown/unlinked chunks; Neo4j retrieval; hybrid fusion/RRF/dedup; vector similarity never asserted as dependency; context budget/truncation and grounded source contract; graph/vector outage behavior.
- API/task integration: request validation, status codes, thin route behavior, Celery task dispatch/status/retries, index failure not undoing graph ingestion, and delete/reindex idempotency.
- Regression: complete existing test suite, explicitly report Module 1 case count/result separately. Add an end-to-end Compose test for one indexed fixture repository when infrastructure is available.

The current `clean_test_output.txt` contains scoring-like output and is not a pytest report. There is no configured linter/type checker/formatter visible in the backend; Stage 2 should run only checks actually configured or add no unrelated tooling.

## 15. Implementation Order

1. Establish a working Python environment; run and record the unchanged Module 1 baseline before code edits.
2. Add typed settings and the chunk/provenance/request/response contracts. Add focused configuration/model tests.
3. Implement deterministic source-symbol and Markdown chunking; preserve Module 1 scanner/parser behavior and validate mapping to existing AST metadata.
4. Implement BGE-M3 interface/adapter and fake-provider tests, including local-only, batching, and resource bounds.
5. Implement Qdrant collection/store adapter and its idempotency, version reconciliation, filtering, and deletion tests.
6. Add the dedicated Celery indexing queue/task and ingestion dispatch/status path; test that graph ingestion remains independently successful.
7. Implement bounded Neo4j impact traversal and the impact endpoint; test both traversal directions and exact repo isolation.
8. Implement semantic entity linking, graph retrieval, fusion, and bounded RAG context contract; add service tests before routes.
9. Add retrieval/context API endpoints and error mapping; verify routes do not expose infrastructure clients.
10. Update Docker Compose, dependency/image setup, `.env.example`, and health/readiness behavior; run disposable Neo4j/Qdrant integration tests.
11. Run full regression/security/configuration checks and confirm no Module 3/4/5 features were introduced.

## 16. Risks and Mitigations

- **Unverified current test baseline:** local interpreters lack required dependencies. Restore an environment and record baseline first; do not use that as a reason to rewrite Module 1.
- **BGE-M3 size and memory:** heavyweight model and per-worker copies can exhaust RAM/VRAM. Isolate the queue/image, lazy-load once per worker, begin with concurrency 1, batch and chunk with hard limits, and allow explicit CPU/GPU deployment configuration.
- **Model dimension/config drift:** reject incompatible collection/model settings before writes; version collection/model/chunker config and require an explicit migration/reindex.
- **Stale or partial vectors:** stable logical IDs plus per-file revision reconciliation, serialized generations, and prune-only-after-success ensure edits/deletes converge without gaps or duplicates.
- **Repository leakage:** enforce exact filters in every Qdrant/Neo4j query, test adversarial cross-repo fixtures, and do not confuse isolation with authorization.
- **Identity collisions:** current symbol IDs omit repository identity. Always scope Neo4j lookup by `repo_url`; use derived `repository_id` in Qdrant IDs/payload filters. Do not change Module 1 IDs.
- **Graph completeness:** Module 1 resolves only unambiguous structural links. Clearly report edges actually stored; do not use semantic scores to fill missing dependency edges.
- **False confidence from README:** validate behavior against source/tests and update only Module 2-specific documentation if needed; do not implement features merely claimed by README.
- **Cross-store consistency:** Neo4j and Qdrant do not share transactions. Keep graph ingestion authoritative and expose vector indexing status independently; retry/reconcile idempotently.
- **Existing security defaults:** hard-coded Compose Neo4j credentials, debug defaults, permissive debug CORS, and absent auth require careful deployment controls. Avoid widening exposure and document blockers to public deployment.

## 17. Module 2 Acceptance Criteria

- Module 1 parser output, symbol IDs, graph schema/relationships, graph APIs, and all pre-existing tests remain compatible; no unnecessary Module 1 rewrite.
- Impact service reports exact-repository direct dependencies and transitive affected entities with relationship direction/path provenance, bounded resource use, correct not-found behavior, and graph failure handling.
- Source and Markdown chunking is deterministic, bounded, non-duplicative, and maps every result to repository/file/entity/language/type/source lines.
- BGE-M3 runs locally by default with bounded batches/resource settings and no repository-content transmission to an external provider.
- Qdrant collection creation is safe/idempotent, vector dimensions are checked, upsert/update/delete/reindex converge on repeated runs, stale chunks are removed only after successful replacement, and every query is repository-filtered.
- Hybrid retrieval fuses semantic and Neo4j evidence while retaining separate provenance; vector similarity is never represented as proof of a dependency.
- RAG context is structured, grounded, source-traceable, bounded, and suitable for a future LLM layer; it generates no LLM answer.
- Celery indexing is asynchronous, separately observable from graph ingestion, retry-safe, and does not place full source repositories/vectors in Redis task messages.
- API routes remain thin; Neo4j/Qdrant are not exposed to frontend clients; secrets, source text, embeddings, and sensitive query/repository data are not logged.
- Docker/configuration supports private Qdrant storage and a resource-bounded embedding worker without hard-coded new credentials or service addresses.
- All Module 1 and Module 2 tests pass in a reproducible environment; applicable integration/configuration/security checks pass; no Module 3, 4, or 5 functionality is added.
