import api from "./api";

// ─── Development-only mock graph data ─────────────────────────────────────
// Used exclusively when the backend /api/graph endpoint is not yet available.
// Isolated here so it can be replaced with zero impact when real backend is running.
const MOCK_GRAPH_DATA = {
    nodes: [
        {
            id: "frontend-web",
            label: "Web Dashboard",
            type: "frontend",
            module: "codespec-frontend",
            language: "React / Vite",
            description: "Single-page application providing the main developer interface for architecture visualization, search, and code intelligence.",
            file: "src/App.jsx",
            metrics: { components: 42, routes: 9, bundleSize: "1.8 MB" },
        },
        {
            id: "api-gateway",
            label: "API Gateway",
            type: "service",
            module: "api-gateway",
            language: "FastAPI / Python",
            description: "Central HTTP gateway handling authentication, rate-limiting, request routing, and response normalization for all downstream services.",
            file: "src/server.py",
            metrics: { endpoints: 48, avgLatency: "12ms", uptime: "99.97%" },
        },
        {
            id: "auth-service",
            label: "Auth Service",
            type: "service",
            module: "auth.service",
            language: "Python / FastAPI",
            description: "Handles JWT token lifecycle, OAuth2/OIDC provider integration, RBAC permissions, and session management.",
            file: "src/auth/service.py",
            metrics: { endpoints: 12, avgLatency: "8ms", uptime: "99.99%" },
        },
        {
            id: "ingestion-engine",
            label: "Ingestion Engine",
            type: "service",
            module: "ingestion.engine",
            language: "Python / AST",
            description: "Orchestrates repository cloning, AST parsing, dependency extraction, and knowledge graph construction pipelines.",
            file: "src/ingestion/engine.py",
            metrics: { endpoints: 6, avgLatency: "340ms", throughput: "~50 repos/hr" },
        },
        {
            id: "search-service",
            label: "Search Service",
            type: "service",
            module: "search.service",
            language: "Python / FastAPI",
            description: "Provides semantic and keyword search across indexed code symbols, functions, classes, and documentation.",
            file: "src/search/service.py",
            metrics: { endpoints: 4, avgLatency: "45ms", indexSize: "2.1 GB" },
        },
        {
            id: "graph-service",
            label: "Graph Service",
            type: "service",
            module: "graph.service",
            language: "Python / PyTree",
            description: "Computes and serves architecture dependency graphs, module relationships, and impact analysis data.",
            file: "src/graph/service.py",
            metrics: { endpoints: 8, avgLatency: "120ms" },
        },
        {
            id: "postgres-db",
            label: "PostgreSQL",
            type: "database",
            module: "database.primary",
            language: "SQL",
            description: "Primary relational datastore for repository metadata, user accounts, ingestion state, and audit logs.",
            metrics: { tables: 34, size: "12.4 GB", connections: 120 },
        },
        {
            id: "redis-cache",
            label: "Redis Cache",
            type: "cache",
            module: "cache.redis",
            language: "Redis 7",
            description: "In-memory cache layer for session tokens, search result caching, rate-limit counters, and pub/sub event distribution.",
            metrics: { keys: "~48K", hitRate: "94.2%", memory: "512 MB" },
        },
        {
            id: "neo4j-graph",
            label: "Neo4j Graph DB",
            type: "database",
            module: "database.graph",
            language: "Cypher",
            description: "Graph database storing code dependency relationships, AST node connections, and architecture topology.",
            metrics: { nodes: "~125K", relationships: "~380K", size: "3.2 GB" },
        },
        {
            id: "github-api",
            label: "GitHub API",
            type: "external",
            module: "external.github",
            language: "REST / GraphQL",
            description: "External integration for repository cloning, webhook subscriptions, PR metadata, and commit history retrieval.",
            metrics: { rateLimit: "5000/hr", version: "v4 GraphQL" },
        },
        {
            id: "s3-storage",
            label: "S3 Object Storage",
            type: "external",
            module: "external.storage",
            language: "AWS S3",
            description: "Object storage for parsed AST artifacts, repository snapshots, generated documentation, and analysis reports.",
            metrics: { buckets: 4, totalSize: "89 GB" },
        },
    ],
    edges: [
        { id: "e1", source: "frontend-web", target: "api-gateway", label: "HTTP/REST" },
        { id: "e2", source: "api-gateway", target: "auth-service", label: "gRPC" },
        { id: "e3", source: "api-gateway", target: "ingestion-engine", label: "REST" },
        { id: "e4", source: "api-gateway", target: "search-service", label: "REST" },
        { id: "e5", source: "api-gateway", target: "graph-service", label: "REST" },
        { id: "e6", source: "auth-service", target: "postgres-db", label: "SQL" },
        { id: "e7", source: "auth-service", target: "redis-cache", label: "Cache" },
        { id: "e8", source: "ingestion-engine", target: "postgres-db", label: "SQL" },
        { id: "e9", source: "ingestion-engine", target: "neo4j-graph", label: "Cypher" },
        { id: "e10", source: "ingestion-engine", target: "github-api", label: "REST" },
        { id: "e11", source: "ingestion-engine", target: "s3-storage", label: "S3 SDK" },
        { id: "e12", source: "search-service", target: "neo4j-graph", label: "Cypher" },
        { id: "e13", source: "search-service", target: "redis-cache", label: "Cache" },
        { id: "e14", source: "graph-service", target: "neo4j-graph", label: "Cypher" },
        { id: "e15", source: "graph-service", target: "postgres-db", label: "SQL" },
    ],
};

/**
 * Normalizes graph data from backend responses to ensure nodes and edges
 * adhere to standard structure regardless of backend property variations.
 */
export function normalizeGraphData(rawData) {
    if (!rawData) return { nodes: [], edges: [] };

    // Support nested payload shapes: { graph: ... }, { data: ... }, or direct { nodes, edges }
    const payload = rawData.graph || rawData.data || rawData;

    const rawNodes = Array.isArray(payload.nodes) ? payload.nodes : [];
    const rawEdges = Array.isArray(payload.edges) ? payload.edges : [];

    const nodes = rawNodes.map((node, idx) => ({
        id: String(node.id ?? node.node_id ?? node.key ?? `node-${idx}`),
        label: node.label ?? node.name ?? node.title ?? node.id ?? `Node ${idx + 1}`,
        type: (node.type || "service").toLowerCase(),
        module: node.module ?? node.package ?? null,
        language: node.language ?? node.tech ?? null,
        description: node.description ?? node.summary ?? null,
        file: node.file ?? node.path ?? null,
        metrics: node.metrics && typeof node.metrics === "object" ? node.metrics : null,
        position: node.position && typeof node.position.x === "number" ? node.position : (typeof node.x === "number" && typeof node.y === "number" ? { x: node.x, y: node.y } : null),
        // Preserve any additional raw fields provided by the backend
        ...node,
    }));

    const edges = rawEdges.map((edge, idx) => ({
        id: String(edge.id ?? `e-${idx}`),
        source: String(edge.source ?? edge.from ?? edge.source_id),
        target: String(edge.target ?? edge.to ?? edge.target_id),
        label: edge.label ?? edge.type ?? edge.relation ?? null,
        // Preserve raw fields
        ...edge,
    }));

    return { nodes, edges };
}

export const architectureApi = {
    /**
     * Fetch architecture graph data for a given repository.
     * Tries GET /api/graph?repo_id=<id>; falls back to isolated mock data if unavailable.
     * @param {string} [repoId] - Optional repository identifier
     */
    getGraph: async (repoId = null) => {
        try {
            const response = await api.get("/graph", {
                params: repoId ? { repo_id: repoId } : {},
            });
            if (response?.data) {
                const normalized = normalizeGraphData(response.data);
                if (normalized.nodes.length > 0) {
                    return normalized;
                }
            }
        } catch (error) {
            console.info("[architectureApi] Backend /api/graph unavailable, using development mock fallback.", error?.message);
        }

        // Development fallback: simulate brief network latency
        await new Promise((resolve) => setTimeout(resolve, 250));
        return normalizeGraphData(MOCK_GRAPH_DATA);
    },

    /**
     * Fetch detailed metadata for a single graph node.
     * Attempts GET /api/graph/node/:nodeId; falls back to looking up node in mock data.
     * @param {string} nodeId - Identifier of the target node
     * @param {string} [repoId] - Optional repository context
     */
    getNodeDetails: async (nodeId, repoId = null) => {
        if (!nodeId) return null;

        try {
            const response = await api.get(`/graph/node/${nodeId}`, {
                params: repoId ? { repo_id: repoId } : {},
            });
            if (response?.data) {
                return response.data;
            }
        } catch (error) {
            console.info("[architectureApi] Backend node details unavailable, falling back to local node data.", error?.message);
        }

        const match = MOCK_GRAPH_DATA.nodes.find((n) => n.id === nodeId);
        return match || null;
    },

    /**
     * Fetch architecture diagram definitions for a repository.
     * Attempts GET /api/diagrams?repo_id=<id>.
     * @param {string} [repoId] - Optional repository identifier
     */
    getDiagrams: async (repoId = null) => {
        try {
            const response = await api.get("/diagrams", {
                params: repoId ? { repo_id: repoId } : {},
            });
            if (response?.data) {
                return response.data;
            }
        } catch (error) {
            console.info("[architectureApi] Backend /api/diagrams unavailable.", error?.message);
        }
        return null;
    },
};

export default architectureApi;
