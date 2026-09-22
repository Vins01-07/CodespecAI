import { create } from "zustand";

export const useRepositoryStore = create((set) => ({
    activeRepository: {
        id: "repo-1",
        name: "CodeSpec-Core-Engine",
        status: "Analyzed",
        branch: "main",
        commit: "8f4a21d",
        language: "TypeScript / Python",
        lastIndexed: "2 mins ago",
        metrics: {
            files: 1248,
            services: 12,
            apis: 48,
            functions: 2340,
            dependencies: 36,
        },
    },
    repositories: [],
    isLoading: false,
    setActiveRepository: (repo) => set({ activeRepository: repo }),
    setRepositories: (repos) => set({ repositories: repos }),
}));

export default useRepositoryStore;
