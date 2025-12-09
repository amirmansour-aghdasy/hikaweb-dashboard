import { create } from "zustand";
import { persist } from "zustand/middleware";

// Get initial darkMode from localStorage or system preference
const getInitialDarkMode = () => {
    if (typeof window === "undefined") return false;
    
    const stored = localStorage.getItem("hikaweb-dark-mode");
    if (stored !== null) {
        return JSON.parse(stored);
    }
    
    // Check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const useUIStore = create(
    persist(
        (set, get) => ({
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
            darkMode: getInitialDarkMode(),
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

            setDarkMode: (darkMode) => {
                set({ darkMode });
                // Update localStorage immediately
                if (typeof window !== "undefined") {
                    localStorage.setItem("hikaweb-dark-mode", JSON.stringify(darkMode));
                }
            },
            toggleDarkMode: () => {
                const current = get().darkMode;
                get().setDarkMode(!current);
            },
            setLanguage: (language) => set({ language }),

            setDataGridPreference: (key, preference) =>
                set((state) => ({
                    dataGridPreferences: {
                        ...state.dataGridPreferences,
                        [key]: preference,
                    },
                })),
        }),
        {
            name: "hikaweb-ui-store",
            partialize: (state) => ({
                darkMode: state.darkMode,
                language: state.language,
                sidebarCollapsed: state.sidebarCollapsed,
                dataGridPreferences: state.dataGridPreferences,
            }),
        }
    )
);
