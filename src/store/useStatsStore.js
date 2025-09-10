import { create } from "zustand";

export const useStatsStore = create((set, get) => ({
    // Dashboard statistics
    stats: {
        overview: {
            totalUsers: 0,
            totalArticles: 0,
            totalServices: 0,
            totalPortfolio: 0,
            totalComments: 0,
            totalTickets: 0,
            pendingTickets: 0,
            newConsultations: 0,
        },
        charts: {
            userGrowth: [],
            contentGrowth: [],
            ticketStatus: [],
            popularServices: [],
            monthlyStats: [],
        },
        lastUpdated: null,
    },

    // Loading states
    loading: {
        overview: false,
        charts: false,
    },

    // Actions
    setStats: (statsData) =>
        set((state) => ({
            stats: {
                ...state.stats,
                ...statsData,
                lastUpdated: Date.now(),
            },
        })),

    setLoading: (type, loading) =>
        set((state) => ({
            loading: {
                ...state.loading,
                [type]: loading,
            },
        })),

    updateOverviewStat: (key, value) =>
        set((state) => ({
            stats: {
                ...state.stats,
                overview: {
                    ...state.stats.overview,
                    [key]: value,
                },
            },
        })),

    addChartData: (chartType, data) =>
        set((state) => ({
            stats: {
                ...state.stats,
                charts: {
                    ...state.stats.charts,
                    [chartType]: data,
                },
            },
        })),

    // Helper to check if stats need refresh (older than 10 minutes)
    needsRefresh: () => {
        const state = get();
        if (!state.stats.lastUpdated) return true;
        return Date.now() - state.stats.lastUpdated > 10 * 60 * 1000; // 10 minutes
    },
}));
