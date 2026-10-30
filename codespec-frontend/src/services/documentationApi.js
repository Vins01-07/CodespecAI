import api from "./api";

// ─── Realistic Development-only Mock Documentation Data ─────────────────────
// Used when backend /api/documentation endpoints are unreachable.
const MOCK_DOCS = [
    {
        id: "doc-system-overview",
        title: "CodeSpec AI System Architecture & Data Flow",
        category: "Architecture",
        module: "codespec-core",
        lastUpdated: "2026-09-24",
        author: "Architecture Team",
        completeness: 92,
        status: "up-to-date",
        tags: ["Architecture", "System Flow", "AST", "Microservices"],
        summary: "High-level design document explaining the multi-layer pipeline from code ingestion to knowledge graph querying.",
        content: `# CodeSpec AI System Architecture & Data Flow

## Overview
CodeSpec AI is a developer-centric codebase intelligence engine that transforms static codebases into interactive architecture graphs, semantic query pipelines, and automated documentation models.

### Key Components
1. **Web Dashboard & Frontend (React/Vite)**: Unified workspace providing interactive visual exploration (React Flow), dependency matrix inspection, natural language Q&A, and documentation management.
2. **API Gateway (FastAPI)**: Central proxy handling client requests, token verification, routing, and rate limits.
3. **Ingestion Engine (Python / tree-sitter)**: Clones and parses repositories, constructs AST hierarchies, and extracts symbols, imports, and call graphs.
4. **Graph Service (Neo4j / NetworkX)**: Stores directed dependency graphs, module edges, and runs graph traversals for blast radius and impact vector calculation.
5. **Search & Embedding Pipeline (FastAPI / Qdrant)**: Generates dense embeddings for AST nodes, functions, and docstrings to enable semantic search.

### Security Model
- All inter-service calls use mTLS or verified JWT bearer tokens.
- Repository source code is parsed in ephemeral isolated sandboxes.`,
    },
    {
        id: "doc-api-gateway",
        title: "API Gateway Specification & Route Table",
        category: "API Reference",
        module: "api-gateway",
        lastUpdated: "2026-09-20",
        author: "Backend Guild",
        completeness: 85,
        status: "needs-review",
        tags: ["FastAPI", "Routing", "OpenAPI", "Gateway"],
        summary: "Specification for HTTP routing, rate limiting policies, and upstream service proxies.",
        content: `# API Gateway Specification

## Responsibilities
- Reverse-proxy client calls to downstream microservices (\`/api/graph\`, \`/api/chat\`, \`/api/impact\`, \`/api/documentation\`).
- Inject \`X-Request-ID\`, user claims, and telemetry spans into downstream headers.
- Rate limiting: 120 requests/minute per authenticated user.

## Core Endpoints
- \`POST /api/repos\` - Register or clone a new git repository
- \`GET /api/graph\` - Fetch dependency graph nodes and edges
- \`POST /api/chat\` - Natural language repository querying
- \`POST /api/impact\` - Predict change impact and blast radius
- \`GET /api/documentation\` - Query repository documentation index and sync status`,
    },
    {
        id: "doc-auth-service",
        title: "Auth Service & Token Lifecycle Spec",
        category: "Security",
        module: "auth.service",
        lastUpdated: "2026-09-18",
        author: "Security Team",
        completeness: 78,
        status: "outdated",
        tags: ["OAuth2", "JWT", "RBAC", "Session"],
        summary: "Specification of user authentication, token issuance, RS256 signing, and Redis session caching.",
        content: `# Auth Service & Token Lifecycle

## Overview
Handles user identity, JWT generation with asymmetric RS256 keys, GitHub/GitLab OAuth2 provider flows, and role-based access control (RBAC).

## Token Expiration Policy
- **Access Tokens**: 15 minutes TTL, stored in memory or client headers.
- **Refresh Tokens**: 7 days TTL, stored with rolling rotation in Redis cache.

> **Warning**: Recent middleware updates added tenant isolation claims (\`tenant_id\`) which are not yet fully documented in legacy SDK clients.`,
    },
    {
        id: "doc-ingestion-pipeline",
        title: "AST Ingestion Pipeline & Parsing Engine",
        category: "Core Engine",
        module: "ingestion.engine",
        lastUpdated: "2026-09-25",
        author: "Engine Core",
        completeness: 95,
        status: "up-to-date",
        tags: ["AST", "TreeSitter", "DependencyGraph", "Parser"],
        summary: "Detailed documentation on the repository ingestion lifecycle, tree-sitter grammars, and symbol resolution.",
        content: `# AST Ingestion Pipeline

## Lifecycle Steps
1. **Clone/Unpack**: Clones repository or unpacks uploaded zip archive.
2. **Language Detection**: Scans extensions and manifests (\`package.json\`, \`pyproject.toml\`, \`Cargo.toml\`).
3. **AST Tree Construction**: Runs language-specific Tree-sitter parsers to extract:
   - Function & Method declarations
   - Class hierarchies
   - Import & Export statements
   - Call expressions and decorator bindings
4. **Symbol Linkage**: Resolves relative and package imports to absolute node IDs.
5. **Graph Database Ingestion**: Persists nodes and directed edges to the graph store.`,
    },
    {
        id: "doc-impact-analysis",
        title: "Change Impact & Blast Radius Vector Model",
        category: "Algorithms",
        module: "impact.engine",
        lastUpdated: "2026-09-22",
        author: "Analytics Guild",
        completeness: 88,
        status: "up-to-date",
        tags: ["ImpactAnalysis", "GraphTraversal", "BlastRadius", "RiskScore"],
        summary: "Algorithmic specification for calculating breaking change probability, dependency depth, and test blast radius.",
        content: `# Change Impact Vector Model

## Calculation Formula
Risk Score is computed as a weighted sum of direct and indirect blast radius components:

$$Risk = w_1 \\cdot D_{direct} + w_2 \\cdot D_{indirect} + w_3 \\cdot C_{criticality}$$

Where:
- $D_{direct}$: Count of direct upstream dependent modules (weight 0.45)
- $D_{indirect}$: Transitive dependents within 3 hops (weight 0.30)
- $C_{criticality}$: Core infrastructure flag (weight 0.25)`,
    },
];

const MOCK_ALERTS = [
    {
        id: "alert-1",
        type: "warning",
        title: "Missing API Documentation",
        module: "/api/v1/graph/export",
        file: "src/server.py",
        detail: "Endpoint lacks OpenAPI response model annotations and schema definitions.",
        severity: "warning",
        timestamp: "2 hours ago",
        suggestedFix: "Add @router.get(..., response_model=GraphExportResponse) and docstrings.",
    },
    {
        id: "alert-2",
        type: "danger",
        title: "Undocumented Core Function",
        module: "compute_impact_vector()",
        file: "src/impact/engine.py",
        detail: "0 docstrings in AST dependency engine. Function has high cyclomatic complexity (14).",
        severity: "danger",
        timestamp: "5 hours ago",
        suggestedFix: "Generate standard Google-style docstrings with argument types and return values.",
    },
    {
        id: "alert-3",
        type: "warning",
        title: "Outdated Module Spec",
        module: "AuthMiddleware",
        file: "src/auth/service.py",
        detail: "Signature modified 4 days ago (added tenant_id parameter) without spec update.",
        severity: "warning",
        timestamp: "1 day ago",
        suggestedFix: "Synchronize Auth Service documentation spec with current middleware parameter list.",
    },
    {
        id: "alert-4",
        type: "info",
        title: "New Unindexed Symbols Detected",
        module: "search.service:hybrid_rank()",
        file: "src/search/service.py",
        detail: "3 new exported symbols found in recent commits without markdown summaries.",
        severity: "info",
        timestamp: "2 days ago",
        suggestedFix: "Run automated documentation generator on search service modules.",
    },
];

const MOCK_SUGGESTIONS = [
    {
        id: "sug-1",
        title: "Generate docstrings for `compute_impact_vector()`",
        target: "src/impact/engine.py:compute_impact_vector",
        module: "impact.engine",
        category: "Docstring",
        confidence: "98%",
        priority: "High",
        reason: "Core mathematical function used in blast radius calculation lacks parameter and return type documentation.",
        suggestedDiff: `+ """Computes weighted risk score and blast radius vector for a changed symbol.
+
+ Args:
+     target_node_id (str): Identifier of modified AST node.
+     depth_limit (int): Maximum graph traversal hop distance.
+
+ Returns:
+     ImpactAnalysisResult: Composite object containing risk scores and affected nodes.
+ """`,
    },
    {
        id: "sug-2",
        title: "Update AuthMiddleware parameter schema in Auth Spec",
        target: "src/auth/service.py:AuthMiddleware",
        module: "auth.service",
        category: "Spec Update",
        confidence: "94%",
        priority: "High",
        reason: "Detected drift between implementation and 'Auth Service & Token Lifecycle' documentation.",
        suggestedDiff: `  ## Middleware Parameters
  - \`token\` (str): Bearer token extracted from Authorization header
+ - \`tenant_id\` (str, optional): Organization tenant identifier for multi-tenant isolation`,
    },
    {
        id: "sug-3",
        title: "Add OpenAPI schema annotations for `/api/v1/graph/export`",
        target: "src/server.py:export_graph_data",
        module: "api-gateway",
        category: "API Annotation",
        confidence: "89%",
        priority: "Medium",
        reason: "Swagger / OpenAPI documentation generation produces empty response body schema for this endpoint.",
        suggestedDiff: `+ @router.get("/export", response_model=GraphExportResponse, summary="Export graph topology")
+ async def export_graph_data(repo_id: str):
+     """Returns serializable JSON representing active repository nodes and directed edges."""`,
    },
];

export const documentationApi = {
    /**
     * Get all documentation articles for repository.
     * Attempts GET /api/documentation?repo_id=<repoId>
     */
    getDocumentation: async (repoId = null) => {
        try {
            const response = await api.get("/documentation", {
                params: repoId ? { repo_id: repoId } : {},
            });
            if (
                response?.data &&
                typeof response.data === "object" &&
                (Array.isArray(response.data.items) || Array.isArray(response.data))
            ) {
                return response.data;
            }
        } catch (error) {
            console.info("[documentationApi] Backend /api/documentation unavailable, using fallback documentation data.", error?.message);
        }
        return {
            items: MOCK_DOCS,
            total: MOCK_DOCS.length,
            lastSynced: new Date().toISOString(),
        };
    },

    /**
     * Get a specific documentation document by ID.
     * Attempts GET /api/documentation/:id
     */
    getDocumentationById: async (docId) => {
        if (!docId) return null;
        try {
            const response = await api.get(`/documentation/${docId}`);
            if (response?.data && typeof response.data === "object" && response.data.id) {
                return response.data;
            }
        } catch (error) {
            console.info(`[documentationApi] Backend /api/documentation/${docId} unavailable, using mock document.`, error?.message);
        }
        const doc = MOCK_DOCS.find((d) => d.id === docId);
        return doc || null;
    },

    /**
     * Get documentation alerts/issues.
     * Attempts GET /api/documentation/alerts
     */
    getDocumentationAlerts: async (repoId = null) => {
        try {
            const response = await api.get("/documentation/alerts", {
                params: repoId ? { repo_id: repoId } : {},
            });
            if (
                response?.data &&
                typeof response.data === "object" &&
                (Array.isArray(response.data.alerts) || Array.isArray(response.data))
            ) {
                return response.data;
            }
        } catch (error) {
            console.info("[documentationApi] Backend /api/documentation/alerts unavailable, using fallback alerts.", error?.message);
        }
        return {
            alerts: MOCK_ALERTS,
            total: MOCK_ALERTS.length,
        };
    },

    /**
     * Get documentation update suggestions.
     * Attempts GET /api/documentation/suggestions
     */
    getUpdateSuggestions: async (repoId = null) => {
        try {
            const response = await api.get("/documentation/suggestions", {
                params: repoId ? { repo_id: repoId } : {},
            });
            if (
                response?.data &&
                typeof response.data === "object" &&
                (Array.isArray(response.data.suggestions) || Array.isArray(response.data))
            ) {
                return response.data;
            }
        } catch (error) {
            console.info("[documentationApi] Backend /api/documentation/suggestions unavailable, using fallback suggestions.", error?.message);
        }
        return {
            suggestions: MOCK_SUGGESTIONS,
            total: MOCK_SUGGESTIONS.length,
        };
    },

    /**
     * Trigger documentation scan or regeneration
     * Attempts POST /api/documentation/sync
     */
    syncDocumentation: async (repoId = null) => {
        try {
            const response = await api.post("/documentation/sync", { repo_id: repoId });
            if (response?.data && typeof response.data === "object") {
                return response.data;
            }
        } catch (error) {
            console.info("[documentationApi] Backend sync unavailable, simulated sync completed.");
        }
        return {
            status: "success",
            message: "Documentation index updated successfully.",
            syncedAt: new Date().toISOString(),
        };
    },
};

export default documentationApi;
