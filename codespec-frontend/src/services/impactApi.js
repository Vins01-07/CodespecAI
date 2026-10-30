import api from "./api";

// ─── Development-only mock impact analyses ────────────────────────────────
// Used exclusively when the backend /api/impact endpoint is not yet available.
// Isolated here so it can be replaced with zero impact when real backend is running.
const MOCK_SCENARIOS = {
    "auth": {
        target: "src/auth/service.py:authenticateUser",
        risk_level: "HIGH",
        risk_score: 84,
        summary: "Modifying `authenticateUser` alters bearer token validation logic and impacts 3 upstream services, 14 API endpoints, and session cache keys in Redis.",
        blast_radius: {
            direct_dependents: 3,
            indirect_dependents: 8,
            affected_files: 6,
            affected_tests: 14,
            breaking_change_risk: "High",
        },
        affected_items: [
            {
                id: "api-gateway",
                name: "API Gateway",
                type: "service",
                impact_type: "direct",
                reason: "Directly calls authenticateUser on all protected /api/* routes",
                file: "src/server.py",
                severity: "HIGH",
            },
            {
                id: "user-service",
                name: "User Service",
                type: "service",
                impact_type: "direct",
                reason: "Relies on UserSession signature returned by authenticateUser",
                file: "src/services/user_service.py",
                severity: "HIGH",
            },
            {
                id: "redis-cache",
                name: "Redis Cache",
                type: "cache",
                impact_type: "direct",
                reason: "Session cache key schema and TTL expiration format",
                file: "src/cache/redis.py",
                severity: "MEDIUM",
            },
            {
                id: "frontend-web",
                name: "Web Dashboard",
                type: "frontend",
                impact_type: "indirect",
                reason: "401 challenge / refresh token retry loop in API client",
                file: "src/services/api.js",
                severity: "LOW",
            },
            {
                id: "postgres-db",
                name: "PostgreSQL",
                type: "database",
                impact_type: "indirect",
                reason: "User credentials and account status queries",
                file: "src/db/models.py",
                severity: "LOW",
            },
        ],
        graph: {
            nodes: [
                { id: "target-node", label: "authenticateUser()", type: "service", isTarget: true, severity: "CRITICAL" },
                { id: "api-gateway", label: "API Gateway", type: "service", impact_type: "direct", severity: "HIGH" },
                { id: "user-service", label: "User Service", type: "service", impact_type: "direct", severity: "HIGH" },
                { id: "redis-cache", label: "Redis Cache", type: "cache", impact_type: "direct", severity: "MEDIUM" },
                { id: "frontend-web", label: "Web Dashboard", type: "frontend", impact_type: "indirect", severity: "LOW" },
                { id: "postgres-db", label: "PostgreSQL", type: "database", impact_type: "indirect", severity: "LOW" },
            ],
            edges: [
                { id: "e1", source: "api-gateway", target: "target-node", label: "calls", severity: "HIGH" },
                { id: "e2", source: "user-service", target: "target-node", label: "imports", severity: "HIGH" },
                { id: "e3", source: "target-node", target: "redis-cache", label: "writes", severity: "MEDIUM" },
                { id: "e4", source: "target-node", target: "postgres-db", label: "queries", severity: "LOW" },
                { id: "e5", source: "frontend-web", target: "api-gateway", label: "HTTP", severity: "LOW" },
            ],
        },
        recommended_actions: [
            "Run authentication unit and integration tests (`pytest tests/auth/`)",
            "Verify token schema backward compatibility before deployment",
            "Ensure Redis session serializer handles optional claims gracefully",
            "Update API documentation if token response payload changes",
        ],
    },
    "ingestion": {
        target: "src/ingestion/engine.py:IngestionPipeline",
        risk_level: "MEDIUM",
        risk_score: 62,
        summary: "Changes to `IngestionPipeline` affect AST parsing and Neo4j graph construction. Downstream graph queries and search indexing may encounter schema divergence.",
        blast_radius: {
            direct_dependents: 3,
            indirect_dependents: 4,
            affected_files: 5,
            affected_tests: 8,
            breaking_change_risk: "Medium",
        },
        affected_items: [
            {
                id: "neo4j-graph",
                name: "Neo4j Graph DB",
                type: "database",
                impact_type: "direct",
                reason: "Graph node schema and edge property creation queries",
                file: "src/db/neo4j_client.py",
                severity: "HIGH",
            },
            {
                id: "graph-service",
                name: "Graph Service",
                type: "service",
                impact_type: "direct",
                reason: "Consumes graph topology populated by IngestionPipeline",
                file: "src/graph/service.py",
                severity: "MEDIUM",
            },
            {
                id: "github-api",
                name: "GitHub API",
                type: "external",
                impact_type: "direct",
                reason: "Repository cloning and webhook rate limit budget",
                file: "src/integrations/github.py",
                severity: "LOW",
            },
            {
                id: "search-service",
                name: "Search Service",
                type: "service",
                impact_type: "indirect",
                reason: "Symbol indexes are rebuilt after ingestion runs",
                file: "src/search/service.py",
                severity: "LOW",
            },
        ],
        graph: {
            nodes: [
                { id: "target-node", label: "IngestionPipeline", type: "service", isTarget: true, severity: "CRITICAL" },
                { id: "neo4j-graph", label: "Neo4j Graph DB", type: "database", impact_type: "direct", severity: "HIGH" },
                { id: "graph-service", label: "Graph Service", type: "service", impact_type: "direct", severity: "MEDIUM" },
                { id: "github-api", label: "GitHub API", type: "external", impact_type: "direct", severity: "LOW" },
                { id: "search-service", label: "Search Service", type: "service", impact_type: "indirect", severity: "LOW" },
            ],
            edges: [
                { id: "e1", source: "target-node", target: "neo4j-graph", label: "writes", severity: "HIGH" },
                { id: "e2", source: "graph-service", target: "neo4j-graph", label: "reads", severity: "MEDIUM" },
                { id: "e3", source: "target-node", target: "github-api", label: "fetches", severity: "LOW" },
                { id: "e4", source: "search-service", target: "neo4j-graph", label: "indexes", severity: "LOW" },
            ],
        },
        recommended_actions: [
            "Validate Neo4j graph migrations and node index constraints",
            "Verify idempotent re-ingestion with large test repositories",
            "Check AST parsing coverage across all supported programming languages",
        ],
    },
    "search": {
        target: "src/search/service.py:SearchService.query",
        risk_level: "LOW",
        risk_score: 35,
        summary: "Changes to `SearchService.query` primarily affect query execution and caching. Impact is largely isolated to search endpoints and Redis cache keys.",
        blast_radius: {
            direct_dependents: 2,
            indirect_dependents: 2,
            affected_files: 3,
            affected_tests: 6,
            breaking_change_risk: "Low",
        },
        affected_items: [
            {
                id: "api-gateway",
                name: "API Gateway",
                type: "service",
                impact_type: "direct",
                reason: "Routes /api/search requests to SearchService",
                file: "src/server.py",
                severity: "MEDIUM",
            },
            {
                id: "redis-cache",
                name: "Redis Cache",
                type: "cache",
                impact_type: "direct",
                reason: "Search result TTL cache key formatting",
                file: "src/cache/redis.py",
                severity: "LOW",
            },
            {
                id: "frontend-web",
                name: "Web Dashboard",
                type: "frontend",
                impact_type: "indirect",
                reason: "Knowledge search result rendering and highlighting",
                file: "src/pages/KnowledgeSearch.jsx",
                severity: "LOW",
            },
        ],
        graph: {
            nodes: [
                { id: "target-node", label: "SearchService.query()", type: "service", isTarget: true, severity: "CRITICAL" },
                { id: "api-gateway", label: "API Gateway", type: "service", impact_type: "direct", severity: "MEDIUM" },
                { id: "redis-cache", label: "Redis Cache", type: "cache", impact_type: "direct", severity: "LOW" },
                { id: "frontend-web", label: "Web Dashboard", type: "frontend", impact_type: "indirect", severity: "LOW" },
            ],
            edges: [
                { id: "e1", source: "api-gateway", target: "target-node", label: "routes", severity: "MEDIUM" },
                { id: "e2", source: "target-node", target: "redis-cache", label: "caches", severity: "LOW" },
                { id: "e3", source: "frontend-web", target: "api-gateway", label: "HTTP", severity: "LOW" },
            ],
        },
        recommended_actions: [
            "Benchmark query latency with large symbol datasets",
            "Verify Redis search cache invalidation logic",
        ],
    },
};

function generateDynamicMock(target, changeType) {
    const isHigh = /auth|gateway|server|db|database|core|config/i.test(target);
    const isMed = /engine|graph|service|sync|pipeline/i.test(target);
    const riskLevel = isHigh ? "HIGH" : isMed ? "MEDIUM" : "LOW";
    const riskScore = isHigh ? 78 : isMed ? 54 : 28;

    return {
        target,
        change_type: changeType || "modify",
        risk_level: riskLevel,
        risk_score: riskScore,
        summary: `Analysis of change to \`${target}\` (${changeType || "modify"}): Detected potential blast radius affecting ${isHigh ? "core routing, data persistence, and downstream dependents" : "localized module callers and test suites"}.`,
        blast_radius: {
            direct_dependents: isHigh ? 3 : isMed ? 2 : 1,
            indirect_dependents: isHigh ? 6 : isMed ? 3 : 1,
            affected_files: isHigh ? 5 : isMed ? 3 : 2,
            affected_tests: isHigh ? 11 : isMed ? 6 : 3,
            breaking_change_risk: isHigh ? "High" : isMed ? "Medium" : "Low",
        },
        affected_items: [
            {
                id: "api-gateway",
                name: "API Gateway",
                type: "service",
                impact_type: "direct",
                reason: `Upstream dependency on ${target}`,
                file: "src/server.py",
                severity: isHigh ? "HIGH" : "MEDIUM",
            },
            {
                id: "postgres-db",
                name: "PostgreSQL",
                type: "database",
                impact_type: "direct",
                reason: "Persistence layer transactions and schema references",
                file: "src/db/models.py",
                severity: isHigh ? "MEDIUM" : "LOW",
            },
            {
                id: "frontend-web",
                name: "Web Dashboard",
                type: "frontend",
                impact_type: "indirect",
                reason: "User interface contracts and response schemas",
                file: "src/App.jsx",
                severity: "LOW",
            },
        ],
        graph: {
            nodes: [
                { id: "target-node", label: target.split("/").pop() || target, type: "service", isTarget: true, severity: "CRITICAL" },
                { id: "api-gateway", label: "API Gateway", type: "service", impact_type: "direct", severity: isHigh ? "HIGH" : "MEDIUM" },
                { id: "postgres-db", label: "PostgreSQL", type: "database", impact_type: "direct", severity: isHigh ? "MEDIUM" : "LOW" },
                { id: "frontend-web", label: "Web Dashboard", type: "frontend", impact_type: "indirect", severity: "LOW" },
            ],
            edges: [
                { id: "e1", source: "api-gateway", target: "target-node", label: "calls", severity: isHigh ? "HIGH" : "MEDIUM" },
                { id: "e2", source: "target-node", target: "postgres-db", label: "reads", severity: "LOW" },
                { id: "e3", source: "frontend-web", target: "api-gateway", label: "HTTP", severity: "LOW" },
            ],
        },
        recommended_actions: [
            `Execute targeted unit tests for ${target}`,
            "Review pull request changes for contract breaking modifications",
            "Verify backward compatibility with dependent modules",
        ],
    };
}

export const impactApi = {
    /**
     * Analyze the impact of changing a target file, symbol, or module.
     * Attempts POST /api/impact with { target, repo_id?, change_type?, symbol?, file? }.
     * Falls back to isolated mock scenarios if the backend is unavailable.
     *
     * @param {object} params
     * @param {string} params.target - Target symbol, file, or component
     * @param {string} [params.repoId] - Scoped repository ID
     * @param {string} [params.changeType] - "modify" | "delete" | "refactor" | "signature_change"
     * @param {string} [params.symbol] - Optional specific symbol name
     * @param {string} [params.file] - Optional specific file path
     * @returns {Promise<object>} Normalized impact analysis response
     */
    analyzeImpact: async ({ target, repoId = null, changeType = "modify", symbol = null, file = null }) => {
        if (!target?.trim()) {
            throw new Error("A target code element or file must be specified.");
        }

        const cleanTarget = target.trim();
        const payload = {
            target: cleanTarget,
            change_type: changeType,
        };
        if (repoId) payload.repo_id = repoId;
        if (symbol) payload.symbol = symbol;
        if (file) payload.file = file;

        try {
            const response = await api.post("/impact", payload);
            if (response?.data) {
                return response.data;
            }
        } catch (error) {
            console.info("[impactApi] Backend /api/impact unavailable, using development mock.", error?.message);
        }

        // Development fallback: simulated latency
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Match predefined scenario or generate dynamic mock
        const lowerTarget = cleanTarget.toLowerCase();
        if (lowerTarget.includes("auth")) {
            return { ...MOCK_SCENARIOS.auth, target: cleanTarget, change_type: changeType };
        } else if (lowerTarget.includes("ingest") || lowerTarget.includes("pipe")) {
            return { ...MOCK_SCENARIOS.ingestion, target: cleanTarget, change_type: changeType };
        } else if (lowerTarget.includes("search")) {
            return { ...MOCK_SCENARIOS.search, target: cleanTarget, change_type: changeType };
        }

        return generateDynamicMock(cleanTarget, changeType);
    },

    /**
     * Get predefined target suggestions for quick selection.
     */
    getSuggestedTargets: () => [
        {
            label: "src/auth/service.py : authenticateUser()",
            target: "src/auth/service.py:authenticateUser",
            symbol: "authenticateUser",
            file: "src/auth/service.py",
            category: "Authentication",
            description: "Core JWT token validation and session verification function",
        },
        {
            label: "src/ingestion/engine.py : IngestionPipeline",
            target: "src/ingestion/engine.py:IngestionPipeline",
            symbol: "IngestionPipeline",
            file: "src/ingestion/engine.py",
            category: "Ingestion",
            description: "Repository AST parsing and knowledge graph construction pipeline",
        },
        {
            label: "src/search/service.py : SearchService.query()",
            target: "src/search/service.py:SearchService.query",
            symbol: "SearchService.query",
            file: "src/search/service.py",
            category: "Search",
            description: "Semantic and keyword symbol search execution endpoint",
        },
        {
            label: "src/server.py : APIGateway router",
            target: "src/server.py:router",
            symbol: "router",
            file: "src/server.py",
            category: "Gateway",
            description: "Central HTTP request router and middleware pipeline",
        },
    ],
};

export default impactApi;
