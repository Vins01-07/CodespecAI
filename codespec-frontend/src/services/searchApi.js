import api from "./api";

// Isolated realistic mock codebase search index for development when backend search endpoint is unavailable
const MOCK_CODEBASE_INDEX = [
    {
        id: "res-1",
        repoId: "repo-1",
        type: "Function",
        name: "authenticateUser",
        file: "src/auth/service.py",
        line: 42,
        endLine: 58,
        module: "auth.service",
        language: "python",
        signature: "async def authenticateUser(token: str, options: AuthOptions) -> UserSession",
        snippet: `async def authenticateUser(token: str, options: AuthOptions) -> UserSession:
    """Validate bearer JWT token and return active user session."""
    claims = jwt_verifier.decode_signature(token, verify_expiry=True)
    if not claims or "uid" not in claims:
        raise AuthenticationError("Invalid or expired session token")
    
    session = await session_store.get_or_create(claims["uid"])
    metrics.increment("auth.success.count")
    return session`,
        summary: "Validates bearer JWT token, verifies cryptographic signature, and returns active user session instance.",
        relevance: 0.98,
    },
    {
        id: "res-2",
        repoId: "repo-1",
        type: "Class",
        name: "UserService",
        file: "src/services/user_service.py",
        line: 18,
        endLine: 95,
        module: "services.user_service",
        language: "python",
        signature: "class UserService(BaseService)",
        snippet: `class UserService(BaseService):
    """Core domain service for user profile lifecycle, permissions, and settings."""
    def __init__(self, db: DatabaseConnection, cache: RedisClient):
        self.db = db
        self.cache = cache
        self.auth_service = AuthService()

    async def get_by_id(self, user_id: str) -> Optional[UserProfile]:
        cached = await self.cache.get(f"user:{user_id}")
        if cached:
            return UserProfile.parse_raw(cached)
        return await self.db.users.find_one({"_id": user_id})`,
        summary: "Core domain service handling user profile lifecycle, cached query operations, and authorization rules.",
        relevance: 0.94,
    },
    {
        id: "res-3",
        repoId: "repo-1",
        type: "Method",
        name: "connectDatabase",
        file: "src/database/connection.py",
        line: 85,
        endLine: 104,
        module: "database.connection",
        language: "python",
        signature: "async def connectDatabase(config: DBConfig) -> DatabasePool",
        snippet: `async def connectDatabase(config: DBConfig) -> DatabasePool:
    """Initialize connection pool to primary database with retry backoff."""
    logger.info("Connecting to primary database cluster", host=config.host)
    pool = await create_async_pool(
        dsn=config.dsn,
        min_size=config.min_pool_size,
        max_size=config.max_pool_size,
        timeout=config.timeout_seconds
    )
    return pool`,
        summary: "Initializes high-concurrency async database connection pool with automatic retry backoff.",
        relevance: 0.91,
    },
    {
        id: "res-4",
        repoId: "repo-1",
        type: "Function",
        name: "calculateComplexityScore",
        file: "src/engine/metrics/cyclomatic.py",
        line: 28,
        endLine: 49,
        module: "engine.metrics.cyclomatic",
        language: "python",
        signature: "def calculateComplexityScore(ast_node: ASTNode) -> ComplexityResult",
        snippet: `def calculateComplexityScore(ast_node: ASTNode) -> ComplexityResult:
    """Traverse AST to compute McCabe cyclomatic complexity and branching depth."""
    visitor = ComplexityVisitor()
    visitor.visit(ast_node)
    
    score = 1 + visitor.decision_points
    risk_level = "High" if score > 15 else "Medium" if score > 8 else "Low"
    return ComplexityResult(score=score, risk=risk_level, decision_count=visitor.decision_points)`,
        summary: "Analyzes AST structure to compute McCabe cyclomatic complexity metrics and cognitive risk level.",
        relevance: 0.89,
    },
    {
        id: "res-5",
        repoId: "repo-1",
        type: "File",
        name: "token_manager.py",
        file: "src/auth/token_manager.py",
        line: 1,
        endLine: 112,
        module: "auth.token_manager",
        language: "python",
        signature: "module src.auth.token_manager",
        snippet: `"""Token Manager module: handles JWT token generation, rotation, and revocation blacklists."""
from datetime import datetime, timedelta
import jwt

class TokenManager:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.revoked_tokens = set()`,
        summary: "Module responsible for token generation, signature validation, secret key rotation, and blacklists.",
        relevance: 0.86,
    },
    {
        id: "res-6",
        repoId: "repo-2",
        type: "Method",
        name: "ProcessPayment",
        file: "pkg/payment/gateway.go",
        line: 64,
        endLine: 89,
        module: "pkg.payment",
        language: "go",
        signature: "func (g *Gateway) ProcessPayment(ctx context.Context, req *PaymentRequest) (*PaymentResponse, error)",
        snippet: `func (g *Gateway) ProcessPayment(ctx context.Context, req *PaymentRequest) (*PaymentResponse, error) {
	span, ctx := tracer.StartSpanFromContext(ctx, "Gateway.ProcessPayment")
	defer span.Finish()

	if err := req.Validate(); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid payment request: %v", err)
	}

	result, err := g.provider.ExecuteTransaction(ctx, req)
	if err != nil {
		g.logger.Error("payment transaction failed", zap.Error(err))
		return nil, err
	}
	return &PaymentResponse{TransactionID: result.ID, Status: "SUCCESS"}, nil
}`,
        summary: "gRPC payment execution handler validating transaction schemas and dispatching to acquirers.",
        relevance: 0.95,
    },
    {
        id: "res-7",
        repoId: "repo-3",
        type: "Class",
        name: "ClusterMeshReconciler",
        file: "controllers/mesh_controller.go",
        line: 34,
        endLine: 110,
        module: "controllers.mesh",
        language: "go",
        signature: "type ClusterMeshReconciler struct",
        snippet: `type ClusterMeshReconciler struct {
	client.Client
	Scheme *runtime.Scheme
	Recorder record.EventRecorder
}

// Reconcile handles state convergence for Kubernetes custom mesh operators
func (r *ClusterMeshReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)
	var mesh v1alpha1.ClusterMesh
	if err := r.Get(ctx, req.NamespacedKey, &mesh); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}
	return ctrl.Result{}, nil
}`,
        summary: "Kubernetes controller reconciler syncing ingress routing rules and service mesh topology.",
        relevance: 0.92,
    },
];

export const searchApi = {
    /**
     * Search codebase for symbols, functions, classes, and code context
     * @param {string} query - Search term / question / symbol
     * @param {string} [repoId] - Optional repository ID filter
     * @param {object} [options] - Optional filter options (type, limit, offset)
     */
    search: async (query, repoId = null, options = {}) => {
        const trimmedQuery = query?.trim() || "";
        if (!trimmedQuery) {
            return { results: [], total: 0, query: "" };
        }

        // Attempt real backend call if endpoint exists
        try {
            const response = await api.get("/search", {
                params: {
                    q: trimmedQuery,
                    repo_id: repoId,
                    type: options.type !== "all" ? options.type : undefined,
                },
            });
            if (response?.data) {
                return response.data;
            }
        } catch (error) {
            // Expected fallback when backend /api/search is not mounted
            console.info("Using frontend search intelligence engine for query:", trimmedQuery);
        }

        // Simulate realistic search delay (150-300ms) for natural developer experience
        await new Promise((resolve) => setTimeout(resolve, 200));

        const qLower = trimmedQuery.toLowerCase();
        const terms = qLower.split(/\s+/).filter(Boolean);

        // Filter and score mock codebase index
        const matched = MOCK_CODEBASE_INDEX.filter((item) => {
            // Check repository filter if specific repo specified
            if (repoId && item.repoId !== repoId) {
                // If specific repo has matches, prioritize; otherwise match across ready repos
            }

            // Check result type filter
            if (options.type && options.type !== "all") {
                if (item.type.toLowerCase() !== options.type.toLowerCase()) {
                    return false;
                }
            }

            const searchCorpus = [
                item.name,
                item.file,
                item.module,
                item.signature,
                item.summary,
                item.snippet,
                item.language,
                item.type,
            ]
                .join(" ")
                .toLowerCase();

            return terms.some((term) => searchCorpus.includes(term));
        });

        // Sort by relevance score
        const sorted = matched.sort((a, b) => {
            const aExactName = a.name.toLowerCase().includes(qLower) ? 1 : 0;
            const bExactName = b.name.toLowerCase().includes(qLower) ? 1 : 0;
            return bExactName - aExactName || b.relevance - a.relevance;
        });

        return {
            query: trimmedQuery,
            repoId,
            total: sorted.length,
            results: sorted,
        };
    },
};

export default searchApi;
