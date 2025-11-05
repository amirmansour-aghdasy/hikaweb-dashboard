/**
 * Utility functions for dashboard
 */

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
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    
    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(d);
};

/**
 * Format date with time
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
export const formatDateTime = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    
    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
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
