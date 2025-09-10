export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        REFRESH: "/auth/refresh",
        ME: "/auth/me",
    },
    USERS: "/api/v1/users",
    ARTICLES: "/api/v1/articles",
    SERVICES: "/api/v1/services",
    PORTFOLIO: "/api/v1/portfolio",
    COMMENTS: "/api/v1/comments",
    TEAM: "/api/v1/team",
    FAQ: "/api/v1/faq",
    TICKETS: "/api/v1/tickets",
    CATEGORIES: "/api/v1/categories",
    BRANDS: "/api/v1/brands",
    CONSULTATIONS: "/api/v1/consultations",
    MEDIA: "/api/v1/media",
    SETTINGS: "/api/v1/settings",
    CAROUSEL: "/api/v1/carousel",
};

export const USER_ROLES = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    EDITOR: "editor",
    MODERATOR: "moderator",
};

export const STATUS_OPTIONS = [
    { value: "active", label: "فعال" },
    { value: "inactive", label: "غیرفعال" },
    { value: "archived", label: "بایگانی" },
];

export const LANGUAGE_OPTIONS = [
    { value: "fa", label: "فارسی" },
    { value: "en", label: "English" },
];

export const ITEMS_PER_PAGE = 20;
