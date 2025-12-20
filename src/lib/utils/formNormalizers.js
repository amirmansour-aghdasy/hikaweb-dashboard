/**
 * Utility functions for normalizing form data from API format to form format
 * These are used when loading existing data into forms
 * 
 * Security features:
 * - Input validation and sanitization
 * - Protection against prototype pollution
 * - Type safety checks
 */

/**
 * Safely extracts a string value, preventing prototype pollution
 * @param {*} value - Value to extract
 * @param {string} defaultValue - Default value if extraction fails
 * @returns {string} Safe string value
 */
const safeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
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
      Object.getPrototypeOf(obj) !== null &&
      !obj.constructor || obj.constructor.name === 'Object') {
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
  if (!idStr || idStr.length === 0) return null;
  
  // Basic validation: IDs should be alphanumeric with common MongoDB/ObjectId characters
  if (!/^[a-zA-Z0-9_-]+$/.test(idStr) && idStr.length > 100) {
    return null; // Reject suspiciously long or malformed IDs
  }
  
  return idStr;
};

/**
 * Normalizes multi-language fields to ensure they're always objects
 * @param {Object|string|null|undefined} value - Value from API
 * @returns {Object} Normalized object with fa and en properties
 */
export const normalizeMultiLang = (value) => {
  if (value === null || value === undefined) {
    return { fa: '', en: '' };
  }
  
  if (typeof value === 'string') {
    return { fa: value, en: '' };
  }
  
  if (typeof value === 'object' && value !== null) {
    // Protection against prototype pollution
    if (Object.getPrototypeOf(value) !== Object.prototype && 
        Object.getPrototypeOf(value) !== null) {
      return { fa: '', en: '' };
    }
    
    return {
      fa: safeString(value.fa, ''),
      en: safeString(value.en, ''),
    };
  }
  
  return { fa: '', en: '' };
};

/**
 * Normalizes categories from API format to form format
 * Handles both populated objects and ObjectIds
 * @param {Array|Object|null|undefined} categories - Categories from API
 * @returns {Array<string>} Array of category IDs (sanitized and validated)
 */
export const normalizeCategoriesForForm = (categories) => {
  if (categories === null || categories === undefined) {
    return [];
  }
  
  if (Array.isArray(categories)) {
    // Limit array size to prevent DoS
    if (categories.length > 1000) {
      console.warn('normalizeCategoriesForForm: Array too large, truncating');
      categories = categories.slice(0, 1000);
    }
    
    return categories
      .map(cat => {
        if (typeof cat === 'object' && cat !== null) {
          return safeExtractId(cat);
        }
        // For primitive values, validate and sanitize
        const idStr = String(cat).trim();
        return idStr && idStr.length > 0 && idStr.length <= 100 ? idStr : null;
      })
      .filter(id => id !== null && id !== undefined);
  }
  
  if (typeof categories === 'object' && categories !== null) {
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
 * Normalizes services/portfolios/related items from API format to form format
 * Handles both populated objects and ObjectIds
 * @param {Array|Object|null|undefined} items - Items from API
 * @returns {Array<string>} Array of item IDs (sanitized and validated)
 */
export const normalizeItemsForForm = (items) => {
  if (items === null || items === undefined) {
    return [];
  }
  
  if (Array.isArray(items)) {
    // Limit array size to prevent DoS
    if (items.length > 1000) {
      console.warn('normalizeItemsForForm: Array too large, truncating');
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
 * Normalizes SEO data from API format to form format
 * @param {Object|null|undefined} seoData - SEO data from API
 * @returns {Object} Normalized SEO object for form
 */
export const normalizeSEOForForm = (seoData) => {
  if (seoData === null || seoData === undefined) {
    return {
      metaTitle: { fa: '', en: '' },
      metaDescription: { fa: '', en: '' },
      metaKeywords: { fa: [], en: [] },
    };
  }

  // Protection against prototype pollution
  if (typeof seoData !== 'object' || seoData === null) {
    return {
      metaTitle: { fa: '', en: '' },
      metaDescription: { fa: '', en: '' },
      metaKeywords: { fa: [], en: [] },
    };
  }

  return {
    metaTitle: normalizeMultiLang(seoData.metaTitle),
    metaDescription: normalizeMultiLang(seoData.metaDescription),
    metaKeywords: {
      fa: safeExtractKeywords(seoData.metaKeywords?.fa),
      en: safeExtractKeywords(seoData.metaKeywords?.en),
    },
  };
};

/**
 * Normalizes tags from API format to form format
 * @param {Object|null|undefined} tagsData - Tags data from API
 * @returns {Object} Normalized tags object with sanitized tag arrays
 */
export const normalizeTagsForForm = (tagsData) => {
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
