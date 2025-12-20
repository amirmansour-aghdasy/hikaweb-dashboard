/**
 * Utility functions for dashboard
 */
import { toJalali, format as jalaaliFormat } from "jalaali-js";

/**
 * Get full media URL from relative or absolute URL
 * @param {string} url - Media URL (can be relative or absolute)
 * @returns {string} Full URL
 */
export const getMediaUrl = (url) => {
    if (!url) return "";
    
    // If URL is already absolute (starts with http:// or https://), return as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    
    // For Arvan Object Storage URLs or other absolute URLs from backend
    // Return as is if it's already a full URL
    if (url.includes("://")) {
        return url;
    }
    
    // If URL starts with /assets/, it's a frontend public asset
    // These should be served from the frontend, not dashboard
    // For dashboard, we'll try to proxy through backend or return empty
    // In production, these should be migrated to Arvan Object Storage
    if (url.startsWith("/assets/")) {
        // Try to get from backend media proxy if available
        // Otherwise, return empty or placeholder
        // TODO: Migrate these assets to Arvan Object Storage
        return ""; // Return empty to prevent 404 errors in dashboard
    }
    
    // If it's a relative URL (starts with /), it should be from backend media endpoint
    // Construct full URL using API base URL
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    // Remove /api/v1 from base URL to get the root
    const baseUrl = apiBaseUrl.replace(/\/api\/v1$/, "");
    
    // Ensure URL starts with /
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    
    return `${baseUrl}${cleanUrl}`;
};

/**
 * Get Persian value from multi-language object
 * @param {Object} obj - Multi-language object with fa and en properties
 * @param {string} fallback - Fallback value if fa is not available
 * @returns {string}
 */
export const getPersianValue = (obj, fallback = "") => {
    if (!obj) return fallback;
    if (typeof obj === "string") return obj;
    return obj.fa || obj.en || fallback;
};

/**
 * Get Persian array from multi-language array
 * @param {Array} arr - Array of multi-language objects
 * @param {string} field - Field name to extract (default: 'name')
 * @returns {Array}
 */
export const getPersianArray = (arr, field = "name") => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item) => {
        if (typeof item === "string") return item;
        const fieldValue = item[field];
        return getPersianValue(fieldValue, item[field] || "");
    });
};

/**
 * Format number for display
 * @param {number} num - Number to format
 * @returns {string}
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return new Intl.NumberFormat("fa-IR").format(num);
};

/**
 * Get Persian month name
 * @param {number} month - Month number (1-12)
 * @returns {string}
 */
const getPersianMonthName = (month) => {
    const months = [
        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان",
        "آذر",
        "دی",
        "بهمن",
        "اسفند",
    ];
    return months[month - 1] || "";
};

/**
 * Format date for display (Jalali/Persian calendar)
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    
    try {
        const jalali = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const monthName = getPersianMonthName(jalali.jm);
        return `${formatNumber(jalali.jd)} ${monthName} ${formatNumber(jalali.jy)}`;
    } catch (error) {
        // Fallback to Intl if conversion fails
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(d);
    }
};

/**
 * Format date with time (Jalali/Persian calendar)
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatDateTime = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    
    try {
        const jalali = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
        const monthName = getPersianMonthName(jalali.jm);
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${formatNumber(jalali.jd)} ${monthName} ${formatNumber(jalali.jy)}، ${formatNumber(hours)}:${formatNumber(minutes)}`;
    } catch (error) {
        // Fallback to Intl if conversion fails
        return new Intl.DateTimeFormat("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    }
};

/**
 * Format relative date (e.g., "2 روز پیش")
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatRelativeDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "امروز";
    if (diffDays === 1) return "دیروز";
    if (diffDays < 7) return `${diffDays} روز پیش`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} هفته پیش`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ماه پیش`;
    return `${Math.floor(diffDays / 365)} سال پیش`;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

/**
 * Generate slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string}
 */
export const generateSlug = (text) => {
    if (!text) return "";
    return text
        .toLowerCase()
        .trim()
        .replace(/[\u200C\u200D\s]+/g, "-") // Replace spaces and zero-width characters with dash
        .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9-]/g, "") // Remove non-Persian/Latin characters
        .replace(/-+/g, "-") // Replace multiple dashes with single dash
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
};

/**
 * Format price for display
 * @param {number} price - Price to format
 * @param {string} currency - Currency code (default: 'IRR')
 * @returns {string}
 */
export const formatPrice = (price, currency = "IRR") => {
    if (price === null || price === undefined) return "-";
    const formatted = formatNumber(price);
    const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "تومان";
    return `${formatted} ${currencySymbol}`;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 بایت";
    
    const k = 1024;
    const sizes = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت", "ترابایت"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Normalize name field - handles both string and multi-language object
 * @param {string|Object} name - Name field (can be string or {fa, en} object)
 * @param {string} fallback - Fallback value
 * @returns {string}
 */
export const normalizeName = (name, fallback = "") => {
    if (!name) return fallback;
    if (typeof name === "string") return name;
    if (typeof name === "object" && name !== null) {
        return name.fa || name.en || fallback;
    }
    return fallback;
};

/**
 * Normalize phone field - handles both 'phone' and 'phoneNumber' field names
 * @param {Object} entity - Entity object (user, teamMember, etc.)
 * @param {string} fallback - Fallback value
 * @returns {string}
 */
export const normalizePhone = (entity, fallback = "") => {
    if (!entity) return fallback;
    // Check both 'phone' and 'phoneNumber' fields
    return entity.phoneNumber || entity.phone || fallback;
};

/**
 * Normalize email field
 * @param {string} email - Email field
 * @param {string} fallback - Fallback value
 * @returns {string}
 */
export const normalizeEmail = (email, fallback = "") => {
    if (!email) return fallback;
    if (typeof email === "string") return email;
    return fallback;
};

/**
 * Normalize avatar field
 * @param {string} avatar - Avatar URL
 * @param {string} fallback - Fallback value
 * @returns {string}
 */
export const normalizeAvatar = (avatar, fallback = null) => {
    if (!avatar) return fallback;
    if (typeof avatar === "string" && avatar.trim()) return avatar;
    return fallback;
};

/**
 * Normalize all common user fields (name, email, phone, avatar)
 * This ensures consistent field access across different entity types (User, TeamMember, etc.)
 * @param {Object} entity - Entity object (user, teamMember, etc.)
 * @param {Object} options - Options for normalization
 * @returns {Object} Normalized fields object
 */
export const normalizeUserFields = (entity, options = {}) => {
    if (!entity) {
        return {
            name: options.nameFallback || "",
            email: options.emailFallback || "",
            phone: options.phoneFallback || "",
            avatar: options.avatarFallback || null,
        };
    }

    return {
        name: normalizeName(entity.name, options.nameFallback || ""),
        email: normalizeEmail(entity.email, options.emailFallback || ""),
        phone: normalizePhone(entity, options.phoneFallback || ""),
        avatar: normalizeAvatar(entity.avatar, options.avatarFallback || null),
    };
};

/**
 * Get initials from name (for avatar fallback)
 * @param {string|Object} name - Name field (can be string or {fa, en} object)
 * @returns {string}
 */
export const getInitials = (name) => {
    const normalizedName = normalizeName(name, "");
    if (!normalizedName) return "?";
    
    const parts = normalizedName.trim().split(" ");
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return normalizedName.substring(0, 2).toUpperCase();
};
