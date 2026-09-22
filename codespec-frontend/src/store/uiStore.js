import { create } from "zustand";

export const useUiStore = create((set) => ({
    sidebarCollapsed: false,
    activeModal: null,
    toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    openModal: (modalId) => set({ activeModal: modalId }),
    closeModal: () => set({ activeModal: null }),
}));

export default useUiStore;
