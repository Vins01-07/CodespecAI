import { create } from "zustand";

const initialRepositories = [
    {
        id: "repo-1",
        name: "CodeSpec-Core-Engine",
        provider: "github",
        url: "https://github.com/codespec-ai/core-engine",
        status: "Ready",
        branch: "main",
        commit: "8f4a21d",
        language: "TypeScript / Python",
        size: "42.8 MB",
        lastIndexed: "2 mins ago",
        createdAt: "2026-09-18",
        metrics: {
            files: 1248,
            services: 12,
            apis: 48,
            functions: 2340,
            dependencies: 36,
        },
    },
    {
        id: "repo-2",
        name: "OmniChannel-Payment-Gateway",
        provider: "github",
        url: "https://github.com/fintech-org/payment-gateway",
        status: "Processing",
        branch: "develop",
        commit: "c3d98ef",
        language: "Go / gRPC",
        size: "18.4 MB",
        lastIndexed: "Processing AST...",
        createdAt: "2026-09-21",
        metrics: {
            files: 412,
            services: 6,
            apis: 24,
            functions: 890,
            dependencies: 19,
        },
    },
    {
        id: "repo-3",
        name: "Kubernetes-Operator-Mesh",
        provider: "github",
        url: "https://github.com/cloud-infra/k8s-operator-mesh",
        status: "Ready",
        branch: "release-v2",
        commit: "91e0a24",
        language: "Go / Rust",
        size: "31.2 MB",
        lastIndexed: "1 hour ago",
        createdAt: "2026-09-15",
        metrics: {
            files: 680,
            services: 8,
            apis: 32,
            functions: 1450,
            dependencies: 28,
        },
    },
    {
        id: "repo-4",
        name: "Legacy-Billing-Service.zip",
        provider: "zip",
        url: "local://archive/billing-service-v1.zip",
        status: "Failed",
        branch: "master",
        commit: "0a8b9cf",
        language: "Java / Spring Boot",
        size: "89.5 MB",
        lastIndexed: "Failed: Parse syntax error in AST pass",
        createdAt: "2026-09-20",
        metrics: {
            files: 940,
            services: 4,
            apis: 16,
            functions: 1820,
            dependencies: 54,
        },
    },
    {
        id: "repo-5",
        name: "Auth-Identity-Provider",
        provider: "github",
        url: "https://github.com/security-team/auth-idp",
        status: "Pending",
        branch: "feature/oauth2-oidc",
        commit: "2f41bc9",
        language: "Rust / Node.js",
        size: "14.1 MB",
        lastIndexed: "Queued for ingestion",
        createdAt: "2026-09-22",
        metrics: {
            files: 230,
            services: 3,
            apis: 12,
            functions: 510,
            dependencies: 14,
        },
    },
];

export const useRepositoryStore = create((set) => ({
    activeRepository: initialRepositories[0],
    repositories: initialRepositories,
    isLoading: false,
    error: null,

    setActiveRepository: (repo) => set({ activeRepository: repo }),

    setRepositories: (repos) => set({ repositories: repos }),

    addRepository: (newRepo) =>
        set((state) => ({
            repositories: [newRepo, ...state.repositories],
            activeRepository: newRepo.status === "Ready" || !state.activeRepository ? newRepo : state.activeRepository,
        })),

    removeRepository: (id) =>
        set((state) => {
            const filtered = state.repositories.filter((r) => r.id !== id);
            return {
                repositories: filtered,
                activeRepository:
                    state.activeRepository?.id === id
                        ? filtered[0] || null
                        : state.activeRepository,
            };
        }),

    updateRepositoryStatus: (id, status, lastIndexed) =>
        set((state) => ({
            repositories: state.repositories.map((r) =>
                r.id === id ? { ...r, status, lastIndexed: lastIndexed || r.lastIndexed } : r
            ),
            activeRepository:
                state.activeRepository?.id === id
                    ? { ...state.activeRepository, status, lastIndexed: lastIndexed || state.activeRepository.lastIndexed }
                    : state.activeRepository,
        })),

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));

export default useRepositoryStore;
