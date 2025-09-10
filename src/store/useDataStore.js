import { create } from "zustand";

export const useDataStore = create((set, get) => ({
    // Cache for different data types
    cache: {
        articles: { data: [], lastFetch: null, page: 1, hasMore: true },
        services: { data: [], lastFetch: null, page: 1, hasMore: true },
        portfolio: { data: [], lastFetch: null, page: 1, hasMore: true },
        users: { data: [], lastFetch: null, page: 1, hasMore: true },
        comments: { data: [], lastFetch: null, page: 1, hasMore: true },
        team: { data: [], lastFetch: null, page: 1, hasMore: true },
        faq: { data: [], lastFetch: null, page: 1, hasMore: true },
        tickets: { data: [], lastFetch: null, page: 1, hasMore: true },
        categories: { data: [], lastFetch: null, page: 1, hasMore: true },
        brands: { data: [], lastFetch: null, page: 1, hasMore: true },
        consultations: { data: [], lastFetch: null, page: 1, hasMore: true },
        carousel: { data: [], lastFetch: null, page: 1, hasMore: true },
        settings: { data: {}, lastFetch: null },
    },

    // Filter states
    filters: {
        articles: { search: "", status: "", category: "", author: "" },
        services: { search: "", status: "", category: "" },
        portfolio: { search: "", status: "", category: "" },
        users: { search: "", role: "", status: "" },
        comments: { search: "", status: "", rating: "" },
        team: { search: "", status: "", role: "" },
        faq: { search: "", category: "", status: "" },
        tickets: { search: "", status: "", priority: "", assignee: "" },
        categories: { search: "", type: "", status: "" },
        brands: { search: "", status: "", field: "" },
        consultations: { search: "", status: "", service: "" },
        carousel: { search: "", status: "", page: "" },
    },

    // Sort states
    sorting: {
        articles: { field: "createdAt", direction: "desc" },
        services: { field: "createdAt", direction: "desc" },
        portfolio: { field: "createdAt", direction: "desc" },
        users: { field: "createdAt", direction: "desc" },
        comments: { field: "createdAt", direction: "desc" },
        team: { field: "order", direction: "asc" },
        faq: { field: "order", direction: "asc" },
        tickets: { field: "createdAt", direction: "desc" },
        categories: { field: "order", direction: "asc" },
        brands: { field: "name", direction: "asc" },
        consultations: { field: "createdAt", direction: "desc" },
        carousel: { field: "order", direction: "asc" },
    },

    // Selected items for bulk operations
    selectedItems: {},

    // Actions
    setData: (type, data, page = 1, append = false) =>
        set((state) => ({
            cache: {
                ...state.cache,
                [type]: {
                    ...state.cache[type],
                    data: append ? [...state.cache[type].data, ...data] : data,
                    lastFetch: Date.now(),
                    page,
                    hasMore: data.length >= 20, // Assuming 20 items per page
                },
            },
        })),

    updateItem: (type, id, updatedData) =>
        set((state) => ({
            cache: {
                ...state.cache,
                [type]: {
                    ...state.cache[type],
                    data: state.cache[type].data.map((item) => (item._id === id ? { ...item, ...updatedData } : item)),
                },
            },
        })),

    addItem: (type, newItem) =>
        set((state) => ({
            cache: {
                ...state.cache,
                [type]: {
                    ...state.cache[type],
                    data: [newItem, ...state.cache[type].data],
                },
            },
        })),

    removeItem: (type, id) =>
        set((state) => ({
            cache: {
                ...state.cache,
                [type]: {
                    ...state.cache[type],
                    data: state.cache[type].data.filter((item) => item._id !== id),
                },
            },
        })),

    setFilter: (type, filters) =>
        set((state) => ({
            filters: {
                ...state.filters,
                [type]: { ...state.filters[type], ...filters },
            },
        })),

    clearFilters: (type) =>
        set((state) => ({
            filters: {
                ...state.filters,
                [type]: Object.keys(state.filters[type]).reduce((acc, key) => {
                    acc[key] = "";
                    return acc;
                }, {}),
            },
        })),

    setSorting: (type, field, direction) =>
        set((state) => ({
            sorting: {
                ...state.sorting,
                [type]: { field, direction },
            },
        })),

    setSelectedItems: (type, items) =>
        set((state) => ({
            selectedItems: {
                ...state.selectedItems,
                [type]: items,
            },
        })),

    clearSelectedItems: (type) =>
        set((state) => ({
            selectedItems: {
                ...state.selectedItems,
                [type]: [],
            },
        })),

    invalidateCache: (type) =>
        set((state) => ({
            cache: {
                ...state.cache,
                [type]: {
                    ...state.cache[type],
                    lastFetch: null,
                    data: [],
                    page: 1,
                    hasMore: true,
                },
            },
        })),

    // Helper to check if data needs refresh (older than 5 minutes)
    needsRefresh: (type) => {
        const state = get();
        const cache = state.cache[type];
        if (!cache.lastFetch) return true;
        return Date.now() - cache.lastFetch > 5 * 60 * 1000; // 5 minutes
    },
}));
