import { create } from "zustand";

export const useArchitectureStore = create((set) => ({
    graphData: null,
    selectedNode: null,
    isLoading: false,
    setSelectedNode: (node) => set({ selectedNode: node }),
    setGraphData: (data) => set({ graphData: data }),
}));

export default useArchitectureStore;
