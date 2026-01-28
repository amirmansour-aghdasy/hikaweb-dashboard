/**
 * Utility functions for transforming form data
 * These functions normalize data from form format to API format
 * 
 * Security features:
 * - Input validation and sanitization
 * - Protection against prototype pollution
 * - Type safety checks
 * - XSS prevention in string outputs
 */

/**
 * Safely extracts a string value with length limits
 * @param {*} value - Value to extract
 * @param {number} maxLength - Maximum allowed length
 * @param {string} defaultValue - Default value if extraction fails
 * @returns {string} Safe string value
 */
const safeString = (value, maxLength = 1000, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return defaultValue;
};

/**
 * Safely extracts an ID from an object, preventing prototype pollution
 * @param {Object} obj - Object to extract ID from
 * @returns {string|null} Safe ID string or null
 */
const safeExtractId = (obj) => {
  if (!obj || typeof obj !== 'object' || obj === null) return null;
  
  // Check if object is from Object.prototype (prototype pollution protection)
  if (Object.getPrototypeOf(obj) !== Object.prototype && 
      Object.getPrototypeOf(obj) !== null) {
    // Only allow plain objects or known safe constructors
    if (obj.constructor && obj.constructor.name !== 'Object' && 
        obj.constructor.name !== 'Array') {
      return null;
    }
  }
  
  // Safely extract _id or id
  const id = obj._id || obj.id;
  if (id === null || id === undefined) return null;
  
  // Validate ID is a safe string
  const idStr = String(id).trim();
  if (!idStr || idStr.length === 0 || idStr.length > 100) return null;
  
  // Basic validation: IDs should be alphanumeric with common MongoDB/ObjectId characters
  if (!/^[a-zA-Z0-9_-]+$/.test(idStr)) {
    return null; // Reject malformed IDs
  }
  
  return idStr;
};

/**
 * Generates a URL-friendly slug from a title
 * @param {string} title - The title to convert to slug
 * @param {string} lang - Language code ('fa' for Persian, 'en' for English)
 * @returns {string} Generated slug (sanitized and safe)
 */
export const generateSlug = (title, lang = 'fa') => {
    if (!title || typeof title !== 'string') return "";
    
    // Limit title length to prevent DoS
    const maxTitleLength = 200;
    const safeTitle = title.length > maxTitleLength 
        ? title.substring(0, maxTitleLength) 
        : title;
    
    if (lang === 'fa') {
        // Persian slug: replace spaces with dash, remove dots and commas, keep Persian characters
        return safeTitle
            .trim()
            .replace(/[،,\.]/g, "") // Remove Persian comma (،), English comma, and dots
            .replace(/\s+/g, "-") // Replace spaces with dash
            .replace(/-+/g, "-") // Replace multiple dashes with single dash
            .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
    } else {
        // English slug: only a-z, 0-9, -
        return safeTitle
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "") // Only keep a-z, 0-9, spaces, and dashes
            .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with dash
            .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
    }
};

/**
 * Checks if a value is a Joi schema object
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a Joi schema object
 */
const isJoiSchemaObject = (value) => {
    if (!value || typeof value !== 'object') return false;
    // Check for Joi schema object indicators (most reliable indicators)
    return (
        '$_root' in value ||
        '$_temp' in value ||
        '_ids' in value ||
        '_preferences' in value ||
        '_rules' in value ||
        '_flags' in value ||
        '$' in value ||
        (value.type && typeof value.type === 'string' && value.type === 'array' && ('$_root' in value || '_root' in value))
    );
};

/**
 * Normalizes categories from form format (objects or IDs) to API format (array of IDs)
 * @param {Array|Object|null|undefined} categories - Categories from form (can be objects with _id or string IDs)
 * @returns {Array<string>} Array of category IDs (sanitized and validated)
 */
export const normalizeCategories = (categories) => {
    if (categories === null || categories === undefined) {
        return [];
    }
    
    // CRITICAL: Check if categories is a Joi schema object
    if (isJoiSchemaObject(categories)) {
        return [];
    }
    
    if (Array.isArray(categories)) {
        // Limit array size to prevent DoS
        if (categories.length > 1000) {
            console.warn('normalizeCategories: Array too large, truncating');
            categories = categories.slice(0, 1000);
        }
        
        return categories
            .map(cat => {
                // Skip Joi schema objects
                if (isJoiSchemaObject(cat)) {
                    return null;
                }
                if (typeof cat === 'object' && cat !== null) {
                    return safeExtractId(cat);
                }
                // For primitive values, validate and sanitize
                const idStr = String(cat).trim();
                return idStr && idStr.length > 0 && idStr.length <= 100 ? idStr : null;
            })
            .filter(id => id !== null && id !== undefined);
    }
    
    // Single category (shouldn't happen in multiple mode, but handle it)
    if (typeof categories === 'object' && categories !== null) {
        // Skip Joi schema objects
        if (isJoiSchemaObject(categories)) {
            return [];
        }
        const id = safeExtractId(categories);
        return id ? [id] : [];
    }
    
    // Handle primitive values
    if (typeof categories === 'string' || typeof categories === 'number') {
        const idStr = String(categories).trim();
        return idStr && idStr.length > 0 && idStr.length <= 100 ? [idStr] : [];
    }
    
    return [];
};

/**
 * Normalizes items (services, portfolios, etc.) from form format to API format
 * @param {Array|Object|null|undefined} items - Items from form (can be objects with _id or string IDs)
 * @returns {Array<string>} Array of item IDs (sanitized and validated)
 */
export const normalizeItems = (items) => {
    if (items === null || items === undefined) {
        return [];
    }
    
    if (Array.isArray(items)) {
        // Limit array size to prevent DoS
        if (items.length > 1000) {
            console.warn('normalizeItems: Array too large, truncating');
            items = items.slice(0, 1000);
        }
        
        return items
            .map(item => {
                if (typeof item === 'object' && item !== null) {
                    return safeExtractId(item);
                }
                // For primitive values, validate and sanitize
                const idStr = String(item).trim();
                return idStr && idStr.length > 0 && idStr.length <= 100 ? idStr : null;
            })
            .filter(id => id !== null && id !== undefined);
    }
    
    if (typeof items === 'object' && items !== null) {
        const id = safeExtractId(items);
        return id ? [id] : [];
    }
    
    // Handle primitive values
    if (typeof items === 'string' || typeof items === 'number') {
        const idStr = String(items).trim();
        return idStr && idStr.length > 0 && idStr.length <= 100 ? [idStr] : [];
    }
    
    return [];
};

/**
 * Safely extracts and validates an array of keywords
 * @param {*} keywords - Keywords to extract
 * @param {number} maxLength - Maximum length for each keyword
 * @returns {Array<string>} Array of safe keyword strings
 */
const safeExtractKeywords = (keywords, maxLength = 50) => {
    if (!Array.isArray(keywords)) {
        return [];
    }
    
    // Limit array size to prevent DoS
    const limitedKeywords = keywords.length > 100 ? keywords.slice(0, 100) : keywords;
    
    return limitedKeywords
        .map(kw => {
            if (kw === null || kw === undefined) return null;
            const kwStr = String(kw).trim();
            // Validate keyword length and content
            if (kwStr.length === 0 || kwStr.length > maxLength) return null;
            // Basic sanitization: remove potentially dangerous characters
            if (/[<>\"'&]/.test(kwStr)) return null;
            return kwStr;
        })
        .filter(kw => kw !== null);
};

/**
 * Normalizes SEO data from form format to API format
 * Only includes fields that have non-empty values
 * @param {Object|null|undefined} seoData - SEO data from form
 * @returns {Object} Normalized SEO object (sanitized)
 */
export const normalizeSEO = (seoData) => {
    if (seoData === null || seoData === undefined) {
        return {};
    }
    
    // Protection against prototype pollution
    if (typeof seoData !== 'object' || seoData === null) {
        return {};
    }
    
    const seo = {};
    const maxTitleLength = 200;
    const maxDescriptionLength = 500;
    
    // Meta Title
    if (seoData.metaTitle) {
        const metaTitle = {};
        const faTitle = safeString(seoData.metaTitle.fa, maxTitleLength);
        const enTitle = safeString(seoData.metaTitle.en, maxTitleLength);
        
        if (faTitle) metaTitle.fa = faTitle;
        if (enTitle) metaTitle.en = enTitle;
        
        if (Object.keys(metaTitle).length > 0) {
            seo.metaTitle = metaTitle;
        }
    }
    
    // Meta Description
    if (seoData.metaDescription) {
        const metaDescription = {};
        const faDesc = safeString(seoData.metaDescription.fa, maxDescriptionLength);
        const enDesc = safeString(seoData.metaDescription.en, maxDescriptionLength);
        
        if (faDesc) metaDescription.fa = faDesc;
        if (enDesc) metaDescription.en = enDesc;
        
        if (Object.keys(metaDescription).length > 0) {
            seo.metaDescription = metaDescription;
        }
    }
    
    // Meta Keywords
    if (seoData.metaKeywords) {
        const metaKeywords = {};
        const faKeywords = safeExtractKeywords(seoData.metaKeywords.fa);
        const enKeywords = safeExtractKeywords(seoData.metaKeywords.en);
        
        if (faKeywords.length > 0) metaKeywords.fa = faKeywords;
        if (enKeywords.length > 0) metaKeywords.en = enKeywords;
        
        if (Object.keys(metaKeywords).length > 0) {
            seo.metaKeywords = metaKeywords;
        }
    }
    
    return seo;
};

/**
 * Normalizes tags from form format to API format
 * @param {Object|null|undefined} tagsData - Tags data from form { fa: [], en: [] }
 * @returns {Object} Normalized tags object with sanitized tag arrays
 */
export const normalizeTags = (tagsData) => {
    if (tagsData === null || tagsData === undefined) {
        return { fa: [], en: [] };
    }
    
    // Protection against prototype pollution
    if (typeof tagsData !== 'object' || tagsData === null) {
        return { fa: [], en: [] };
    }
    
    return {
        fa: safeExtractKeywords(tagsData.fa),
        en: safeExtractKeywords(tagsData.en),
    };
};

/**
 * Denormalizes categories from API format (array of IDs) to form format (array of objects)
 * This is used when loading existing data into the form
 * @param {Array<string>|null|undefined} categoryIds - Array of category IDs from API
 * @param {Array<Object>} allCategories - All available categories from API
 * @returns {Array<Object>} Array of category objects (sanitized)
 */
export const denormalizeCategories = (categoryIds, allCategories = []) => {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) return [];
    if (!Array.isArray(allCategories) || allCategories.length === 0) return [];
    
    // Limit array size to prevent DoS
    const limitedIds = categoryIds.length > 1000 ? categoryIds.slice(0, 1000) : categoryIds;
    
    return limitedIds
        .map(id => {
            // Validate ID format
            if (typeof id !== 'string' || id.length === 0 || id.length > 100) {
                return null;
            }
            
            // Find matching category
            const category = allCategories.find(cat => {
                if (!cat || typeof cat !== 'object') return false;
                const catId = cat._id || cat.id;
                return catId && String(catId) === String(id);
            });
            
            // Only return if category is a valid object (prototype pollution protection)
            if (category && typeof category === 'object' && category !== null) {
                // Additional safety check
                if (Object.getPrototypeOf(category) === Object.prototype || 
                    (category.constructor && category.constructor.name === 'Object')) {
                    return category;
                }
            }
            
            return null;
        })
        .filter(cat => cat !== null);
};
