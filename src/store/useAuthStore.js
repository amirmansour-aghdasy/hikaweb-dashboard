import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            hasCheckedAuth: false, // Global flag to track if auth has been checked
            isCheckingAuth: false, // Global flag to prevent multiple simultaneous checks

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setToken: (token) => set({ token }),
            setLoading: (loading) => set({ loading }),
            setHasCheckedAuth: (hasChecked) => set({ hasCheckedAuth: hasChecked }),
            setIsCheckingAuth: (isChecking) => set({ isCheckingAuth: isChecking }),

            clearAuth: () =>
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    hasCheckedAuth: false,
                }),

            updateUser: (userData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...userData } : null,
                })),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
