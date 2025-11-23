import { toJalaali, toGregorian, jalaaliToDateObject } from "jalaali-js";

/**
 * Convert Gregorian date to Jalaali (Persian) date
 * @param {Date|string} date - Gregorian date
 * @returns {Object} Jalaali date object { jy, jm, jd }
 */
export function toPersianDate(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const [jy, jm, jd] = toJalaali(
        dateObj.getFullYear(),
        dateObj.getMonth() + 1,
        dateObj.getDate()
    );
    return { jy, jm, jd };
}

/**
 * Convert Jalaali date to Gregorian date
 * @param {number} jy - Jalaali year
 * @param {number} jm - Jalaali month
 * @param {number} jd - Jalaali day
 * @returns {Date} Gregorian date
 */
export function fromPersianDate(jy, jm, jd) {
    const [gy, gm, gd] = toGregorian(jy, jm, jd);
    return new Date(gy, gm - 1, gd);
}

/**
 * Format Jalaali date to string (YYYY/MM/DD)
 * @param {Object} jDate - Jalaali date object { jy, jm, jd }
 * @returns {string} Formatted date string
 */
export function formatPersianDate(jDate) {
    if (!jDate) return "";
    const { jy, jm, jd } = jDate;
    return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

/**
 * Parse Persian date string to Jalaali date object
 * @param {string} dateString - Date string in format YYYY/MM/DD or YYYY-MM-DD
 * @returns {Object|null} Jalaali date object { jy, jm, jd } or null if invalid
 */
export function parsePersianDate(dateString) {
    if (!dateString) return null;
    
    // Support both / and - separators
    const parts = dateString.split(/[\/\-]/);
    if (parts.length !== 3) return null;
    
    const jy = parseInt(parts[0], 10);
    const jm = parseInt(parts[1], 10);
    const jd = parseInt(parts[2], 10);
    
    if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
    
    return { jy, jm, jd };
}

/**
 * Convert Date to Persian date string for input value
 * @param {Date|string|null} date - Date to convert
 * @returns {string} Persian date string (YYYY/MM/DD) or empty string
 */
export function dateToPersianInput(date) {
    if (!date) return "";
    const jDate = toPersianDate(date);
    return formatPersianDate(jDate);
}

/**
 * Convert Persian date string to Date object
 * @param {string} persianDate - Persian date string (YYYY/MM/DD)
 * @returns {Date|null} Date object or null if invalid
 */
export function persianInputToDate(persianDate) {
    if (!persianDate) return null;
    const jDate = parsePersianDate(persianDate);
    if (!jDate) return null;
    return fromPersianDate(jDate.jy, jDate.jm, jDate.jd);
}

/**
 * Get today's date in Persian format
 * @returns {string} Today's date in Persian format (YYYY/MM/DD)
 */
export function getTodayPersian() {
    return dateToPersianInput(new Date());
}

/**
 * Get month names in Persian
 */
export const PERSIAN_MONTHS = [
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

/**
 * Get day names in Persian
 */
export const PERSIAN_DAYS = [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنج‌شنبه",
    "جمعه",
];

