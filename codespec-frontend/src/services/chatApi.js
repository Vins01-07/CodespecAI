import api from "./api";

// ─── Development-only mock Q&A responses ──────────────────────────────────
// Used exclusively when the backend /api/chat endpoint is not yet available.
// Isolated here so it can be removed with zero impact when real API is ready.
const MOCK_RESPONSES = [
    {
        question: null, // generic fallback
        answer:
            "Based on the indexed codebase, the **AuthService** handles JWT token lifecycle and OAuth2/OIDC provider integration.\n\nThe `authenticateUser()` function in `src/auth/service.py` validates bearer JWT tokens by:\n1. Decoding the cryptographic signature via `jwt_verifier.decode_signature()`\n2. Verifying expiry claims and extracting the user ID\n3. Creating or retrieving an active session from the session store\n4. Incrementing the `auth.success.count` metric\n\nThe service depends on `RedisClient` for session caching and `PostgreSQL` for persistent user account storage.",
        sources: [
            {
                file: "src/auth/service.py",
                line: 42,
                endLine: 58,
                module: "auth.service",
                symbol: "authenticateUser",
                snippet:
                    'async def authenticateUser(token: str, options: AuthOptions) -> UserSession:\n    """Validate bearer JWT token and return active user session."""\n    claims = jwt_verifier.decode_signature(token, verify_expiry=True)\n    if not claims or "uid" not in claims:\n        raise AuthenticationError("Invalid or expired session token")',
                language: "python",
            },
            {
                file: "src/services/user_service.py",
                line: 18,
                endLine: 50,
                module: "services.user_service",
                symbol: "UserService",
                snippet:
                    'class UserService(BaseService):\n    """Core domain service for user profile lifecycle."""\n    def __init__(self, db: DatabaseConnection, cache: RedisClient):\n        self.db = db\n        self.cache = cache',
                language: "python",
            },
        ],
        confidence: 0.94,
    },
    {
        question: null,
        answer:
            "The **Ingestion Engine** (`src/ingestion/engine.py`) orchestrates the full repository analysis pipeline:\n\n1. **Clone/Pull** — Fetches the repository via the GitHub API integration\n2. **AST Parsing** — Walks the file tree and builds abstract syntax trees per file\n3. **Dependency Extraction** — Identifies imports, function calls, and module relationships\n4. **Graph Construction** — Writes nodes and edges to the Neo4j graph database\n\nThe pipeline is designed to be idempotent — re-ingesting a repository updates existing nodes rather than duplicating them. Processing throughput is approximately ~50 repos/hr.",
        sources: [
            {
                file: "src/ingestion/engine.py",
                line: 12,
                endLine: 45,
                module: "ingestion.engine",
                symbol: "IngestionPipeline",
                snippet:
                    'class IngestionPipeline:\n    """Orchestrates repository cloning, AST parsing, and graph construction."""\n    async def run(self, repo_url: str, branch: str = "main"):\n        repo = await self.clone_or_pull(repo_url, branch)\n        ast_forest = self.parse_ast(repo.file_tree)\n        deps = self.extract_dependencies(ast_forest)',
                language: "python",
            },
        ],
        confidence: 0.91,
    },
    {
        question: null,
        answer:
            "The search functionality is powered by the **Search Service** (`src/search/service.py`), which provides both semantic and keyword search across indexed code symbols.\n\nSearch results are cached in **Redis** with a configurable TTL to avoid redundant Neo4j queries. The current index size is approximately 2.1 GB covering all ingested repositories.\n\nThe service exposes 4 REST endpoints through the API Gateway and achieves an average latency of ~45ms per query.",
        sources: [
            {
                file: "src/search/service.py",
                line: 28,
                endLine: 65,
                module: "search.service",
                symbol: "SearchService.query",
                snippet:
                    'async def query(self, q: str, repo_id: str = None, limit: int = 20):\n    """Execute semantic + keyword search across indexed symbols."""\n    cache_key = f"search:{hash(q)}:{repo_id}"\n    cached = await self.redis.get(cache_key)\n    if cached:\n        return json.loads(cached)',
                language: "python",
            },
        ],
        confidence: 0.88,
    },
];

let _mockIndex = 0;

function getMockResponse(question) {
    const response = MOCK_RESPONSES[_mockIndex % MOCK_RESPONSES.length];
    _mockIndex++;
    return {
        answer: response.answer,
        sources: response.sources || [],
        confidence: response.confidence ?? null,
        question,
    };
}

export const chatApi = {
    /**
     * Send a question about the codebase and receive an AI-generated answer.
     * Attempts POST /api/chat with { question, repo_id?, conversation_id? }.
     * Falls back to isolated mock data if the backend is unavailable.
     *
     * @param {string} question - The user's question
     * @param {object} [options] - Optional context
     * @param {string} [options.repoId] - Repository to scope the question to
     * @param {string} [options.conversationId] - Existing conversation thread ID
     * @returns {Promise<{answer: string, sources?: Array, confidence?: number, conversation_id?: string}>}
     */
    ask: async (question, options = {}) => {
        if (!question?.trim()) {
            return { answer: "", sources: [], confidence: null };
        }

        try {
            const payload = {
                question: question.trim(),
            };
            if (options.repoId) payload.repo_id = options.repoId;
            if (options.conversationId) payload.conversation_id = options.conversationId;

            const response = await api.post("/chat", payload);

            if (response?.data) {
                return {
                    answer: response.data.answer || response.data.response || response.data.message || "",
                    sources: Array.isArray(response.data.sources) ? response.data.sources : [],
                    confidence: response.data.confidence ?? null,
                    conversation_id: response.data.conversation_id ?? null,
                };
            }
        } catch (error) {
            console.info("[chatApi] Backend /api/chat unavailable, using development mock.", error?.message);
        }

        // Development fallback with simulated latency
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 600));
        const mock = getMockResponse(question);
        return {
            ...mock,
            conversation_id: options.conversationId || "mock-conv-" + Date.now(),
        };
    },
};

export default chatApi;
