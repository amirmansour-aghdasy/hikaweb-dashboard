import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { faIR } from "date-fns/locale";

/**
 * Format date for display
 */
export const formatDate = (date, formatStr = "yyyy/MM/dd") => {
    if (!date) return "-";

    try {
        const dateObj = typeof date === "string" ? parseISO(date) : date;

        if (!isValid(dateObj)) return "-";

        return format(dateObj, formatStr, { locale: faIR });
    } catch (error) {
        console.error("Date formatting error:", error);
        return "-";
    }
};

/**
 * Format date with relative time
 */
export const formatRelativeDate = (date) => {
    if (!date) return "-";

    try {
        const dateObj = typeof date === "string" ? parseISO(date) : date;

        if (!isValid(dateObj)) return "-";

        return formatDistanceToNow(dateObj, {
            addSuffix: true,
            locale: faIR,
        });
    } catch (error) {
        console.error("Relative date formatting error:", error);
        return "-";
    }
};

// Validate email
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (number) => {
    if (!number && number !== 0) return "0";
    return new Intl.NumberFormat("fa-IR").format(number);
};

/**
 * Format price with currency
 */
export const formatPrice = (amount, currency = "IRR") => {
    if (!amount && amount !== 0) return "-";

    const currencySymbols = {
        IRR: "ریال",
        USD: "$",
        EUR: "€",
    };

    const symbol = currencySymbols[currency] || currency;

    // Format number with thousand separators
    const formattedAmount = new Intl.NumberFormat("fa-IR").format(amount);

    return `${formattedAmount} ${symbol}`;
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate slug from text
 */
export const generateSlug = (text) => {
    if (!text) return "";

    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 100) => {
    if (!text) return "";

    if (text.length <= maxLength) return text;

    return text.substring(0, maxLength).trim() + "...";
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
    if (!name) return "";

    return name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase()
        .substring(0, 2);
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate URL
 */
export const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Get status color
 */
export const getStatusColor = (status) => {
    const statusColors = {
        active: "success",
        inactive: "error",
        pending: "warning",
        approved: "success",
        rejected: "error",
        published: "success",
        draft: "warning",
        archived: "default",
    };

    return statusColors[status] || "default";
};

/**
 * Get status label
 */
export const getStatusLabel = (status) => {
    const statusLabels = {
        active: "فعال",
        inactive: "غیرفعال",
        pending: "در انتظار",
        approved: "تایید شده",
        rejected: "رد شده",
        published: "منتشر شده",
        draft: "پیش‌نویس",
        archived: "بایگانی",
    };

    return statusLabels[status] || status;
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => deepClone(item));
    if (typeof obj === "object") {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
};

/**
 * Remove empty values from object
 */
export const removeEmptyValues = (obj) => {
    const result = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];

            if (value !== null && value !== undefined && value !== "") {
                if (typeof value === "object" && !Array.isArray(value)) {
                    const cleaned = removeEmptyValues(value);
                    if (Object.keys(cleaned).length > 0) {
                        result[key] = cleaned;
                    }
                } else {
                    result[key] = value;
                }
            }
        }
    }

    return result;
};

/**
 * Convert object to form data
 */
export const objectToFormData = (obj, formData = new FormData(), parentKey = "") => {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const formKey = parentKey ? `${parentKey}[${key}]` : key;

            if (value instanceof File) {
                formData.append(formKey, value);
            } else if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (item instanceof File) {
                        formData.append(`${formKey}[${index}]`, item);
                    } else if (typeof item === "object") {
                        objectToFormData(item, formData, `${formKey}[${index}]`);
                    } else {
                        formData.append(`${formKey}[${index}]`, item);
                    }
                });
            } else if (typeof value === "object" && value !== null) {
                objectToFormData(value, formData, formKey);
            } else {
                formData.append(formKey, value);
            }
        }
    }

    return formData;
};
