import { create } from "zustand";
import architectureApi from "../services/architectureAPI";

export const useArchitectureStore = create((set, get) => ({
    graphData: null,
    selectedNode: null,
    selectedNodeDetails: null,
    isLoading: false,
    isLoadingDetails: false,
    error: null,
    typeFilter: "all",
    searchQuery: "",

    setTypeFilter: (filter) => set({ typeFilter: filter }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    setSelectedNode: (node) => set({ selectedNode: node }),
    setSelectedNodeDetails: (details) => set({ selectedNodeDetails: details }),

    clearSelection: () => set({ selectedNode: null, selectedNodeDetails: null }),

    fetchGraph: async (repoId = null) => {
        set({ isLoading: true, error: null });
        try {
            const data = await architectureApi.getGraph(repoId);
            set({ graphData: data, isLoading: false });
            return data;
        } catch (err) {
            console.error("Failed to load architecture graph:", err);
            set({
                error: "Failed to load architecture graph. Please check network connectivity or backend service.",
                isLoading: false,
            });
            return null;
        }
    },

    selectNode: async (node, repoId = null) => {
        if (!node) {
            set({ selectedNode: null, selectedNodeDetails: null });
            return;
        }

        set({ selectedNode: node, isLoadingDetails: true });

        try {
            const details = await architectureApi.getNodeDetails(node.id, repoId);
            // Merge available details while preserving any existing node data
            set({
                selectedNodeDetails: details ? { ...node, ...details } : node,
                isLoadingDetails: false,
            });
        } catch (err) {
            console.warn("Could not fetch remote node details, using local data", err);
            set({ selectedNodeDetails: node, isLoadingDetails: false });
        }
    },

    setGraphData: (data) => set({ graphData: data }),
}));

export default useArchitectureStore;
