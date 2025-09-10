import { create } from "zustand";

export const useUIStore = create((set, get) => ({
    // Sidebar state
    sidebarOpen: true,
    sidebarCollapsed: false,

    // Loading states
    loading: false,
    pageLoading: false,

    // Modal states
    modals: {},

    // Snackbar/Toast state
    snackbar: {
        open: false,
        message: "",
        severity: "info",
    },

    // Theme and UI preferences
    darkMode: false,
    language: "fa",

    // Data grid preferences
    dataGridPreferences: {},

    // Actions
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

    setLoading: (loading) => set({ loading }),
    setPageLoading: (pageLoading) => set({ pageLoading }),

    openModal: (modalId, data = {}) =>
        set((state) => ({
            modals: { ...state.modals, [modalId]: { open: true, data } },
        })),

    closeModal: (modalId) =>
        set((state) => ({
            modals: { ...state.modals, [modalId]: { open: false, data: {} } },
        })),

    showSnackbar: (message, severity = "info") =>
        set({
            snackbar: { open: true, message, severity },
        }),

    hideSnackbar: () =>
        set({
            snackbar: { open: false, message: "", severity: "info" },
        }),

    setDarkMode: (darkMode) => set({ darkMode }),
    setLanguage: (language) => set({ language }),

    setDataGridPreference: (key, preference) =>
        set((state) => ({
            dataGridPreferences: {
                ...state.dataGridPreferences,
                [key]: preference,
            },
        })),
}));
