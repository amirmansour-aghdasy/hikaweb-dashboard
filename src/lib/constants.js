export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        REFRESH: "/auth/refresh",
        ME: "/auth/me",
        CSRF_TOKEN: "/auth/csrf-token",
    },
    USERS: "/users",
    ARTICLES: "/articles",
    SERVICES: "/services",
    PORTFOLIO: "/portfolio",
    COMMENTS: "/comments",
    TEAM: "/team",
    FAQ: "/faq",
    TICKETS: "/tickets",
    CATEGORIES: "/categories",
    BRANDS: "/brands",
    CONSULTATIONS: "/consultations",
    MEDIA: "/media",
    SETTINGS: "/settings",
    CAROUSEL: "/carousel",
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
