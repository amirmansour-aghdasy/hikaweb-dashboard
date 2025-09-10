import { clsx } from "clsx";

export function cn(...inputs) {
    return clsx(inputs);
}

export function formatDate(date, options = {}) {
    const defaultOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        ...options,
    };

    return new Intl.DateTimeFormat("fa-IR", defaultOptions).format(new Date(date));
}

export function formatNumber(number) {
    return new Intl.NumberFormat("fa-IR").format(number);
}

export function truncateText(text, length = 100) {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePhone(phone) {
    const re = /^09\d{9}$/;
    return re.test(phone);
}
