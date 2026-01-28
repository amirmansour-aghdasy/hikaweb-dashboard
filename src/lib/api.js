import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

// SECURITY: Whitelist of allowed API endpoints to prevent SSRF and RCE attacks
// Dashboard uses client-side axios, but we still validate endpoints for security
const ALLOWED_ENDPOINT_PATTERNS = [
    // Auth endpoints
    /^\/auth\//,
    // Analytics (support both /analytics and /analytics/...)
    /^\/analytics(\/.*)?$/,
    // Articles
    /^\/articles(\/.*)?$/,
    // Services
    /^\/services(\/.*)?$/,
    // Portfolio
    /^\/portfolio(\/.*)?$/,
    // Categories
    /^\/categories(\/.*)?$/,
    // Users/Team/Roles
    /^\/users(\/.*)?$/,
    /^\/team(\/.*)?$/,
    /^\/roles(\/.*)?$/,
    // Tasks
    /^\/tasks(\/.*)?$/,
    // Tickets
    /^\/tickets(\/.*)?$/,
    // Comments
    /^\/comments(\/.*)?$/,
    // Consultations
    /^\/consultations(\/.*)?$/,
    // Contact Messages
    /^\/contact-messages(\/.*)?$/,
    // Notifications (support both /notifications and /notifications/...)
    /^\/notifications(\/.*)?$|^\/notifications$/,
    // Settings
    /^\/settings(\/.*)?$/,
    // Media/Uploads
    /^\/media(\/.*)?$/,
    /^\/upload(\/.*)?$/,
    // FAQ
    /^\/faq(\/.*)?$/,
    // Banners
    /^\/banners(\/.*)?$/,
    // Brands
    /^\/brands(\/.*)?$/,
    // Logs
    /^\/logs(\/.*)?$/,
    // Carousel
    /^\/carousel(\/.*)?$/,
    // Calendar
    /^\/calendar(\/.*)?$/,
    // Videos
    /^\/videos(\/.*)?$/,
    // Products
    /^\/products(\/.*)?$/,
    // Orders
    /^\/orders(\/.*)?$/,
    // Payments
    /^\/payments(\/.*)?$/,
    // Shipping
    /^\/shipping(\/.*)?$/,
    // Coupons
    /^\/coupons(\/.*)?$/,
];

/**
 * Validate endpoint to prevent SSRF and RCE attacks
 * @param {string} endpoint - API endpoint to validate
 * @returns {boolean} True if endpoint is allowed
 */
function isValidEndpoint(endpoint) {
    // Handle null, undefined, or empty endpoints
    if (!endpoint || typeof endpoint !== 'string' || endpoint.trim() === '') {
        // Allow null/undefined/empty endpoints (they will be handled by the caller)
        return true;
    }
    
    // Remove query string for pattern matching (we'll validate it separately)
    const endpointWithoutQuery = endpoint.split('?')[0];
    // Remove leading slash for pattern matching
    const cleanEndpoint = endpointWithoutQuery.startsWith('/') ? endpointWithoutQuery : `/${endpointWithoutQuery}`;
    
    // Check if endpoint matches any allowed pattern
    const isAllowed = ALLOWED_ENDPOINT_PATTERNS.some(pattern => pattern.test(cleanEndpoint));
    
    if (!isAllowed) {
        console.error(`[SECURITY] Blocked unauthorized endpoint access: ${endpoint}`);
        return false;
    }
    
    // Validate query string if present (prevent injection attacks)
    if (endpoint.includes('?')) {
        const queryString = endpoint.split('?')[1];
        // Allow safe query parameters (alphanumeric, dash, underscore, equals, ampersand for key=value pairs)
        // This allows values like "fileType=video", "limit=100", etc.
        // Split by & to validate each parameter separately
        const params = queryString.split('&');
        for (const param of params) {
            // Each parameter should be in format key=value or just key
            if (param.includes('=')) {
                const [key, ...valueParts] = param.split('=');
                const value = valueParts.join('='); // Rejoin in case value contains =
                // Key should only contain safe characters
                // Allow bracket notation for nested objects (e.g., digitalProduct[contentType])
                if (!/^[a-zA-Z0-9_\[\]-]+$/.test(key)) {
                    console.error(`[SECURITY] Blocked suspicious query parameter key: ${key}`);
                    return false;
                }
                // Value should only contain safe characters
                // Allow commas for legitimate use cases like role=admin,support
                // Allow URL-encoded values (will be decoded by URLSearchParams)
                if (!/^[a-zA-Z0-9_\-,%]+$/.test(value)) {
                    console.error(`[SECURITY] Blocked suspicious query parameter value: ${param}`);
                    return false;
                }
            } else {
                // Single parameter without value
                if (!/^[a-zA-Z0-9_-]+$/.test(param)) {
                    console.error(`[SECURITY] Blocked suspicious query parameter: ${param}`);
                    return false;
                }
            }
        }
    }
    
    // Additional security: Prevent protocol-relative and absolute URLs
    if (endpoint.includes('://') || endpoint.startsWith('//')) {
        console.error(`[SECURITY] Blocked SSRF attempt: ${endpoint}`);
        return false;
    }
    
    // Prevent path traversal
    if (endpoint.includes('..') || endpoint.includes('~')) {
        console.error(`[SECURITY] Blocked path traversal attempt: ${endpoint}`);
        return false;
    }
    
    return true;
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
    timeout: 30000,
    withCredentials: true, // Enable credentials for CORS
    headers: {
        "Content-Type": "application/json", 
        "Accept-Language": "fa",
    },
    // SECURITY: Prevent redirects to external URLs (SSRF protection)
    maxRedirects: 0,
});

// CSRF Token Management
let csrfToken = null;
let csrfTokenPromise = null;
let isFetchingCsrf = false;

const getCsrfToken = async () => {
    // Return cached token if available
    if (csrfToken) return csrfToken;
    
    // If already fetching, return the existing promise to prevent duplicate requests
    if (isFetchingCsrf && csrfTokenPromise) {
        return csrfTokenPromise;
    }
    
    try {
        const token = Cookies.get("token");
        if (!token) return null;
        
        isFetchingCsrf = true;
        // SECURITY: Validate CSRF endpoint
        const csrfEndpoint = '/auth/csrf-token';
        if (!isValidEndpoint(csrfEndpoint)) {
            isFetchingCsrf = false;
            csrfTokenPromise = null;
            return null;
        }
        
        csrfTokenPromise = axios.get(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}${csrfEndpoint}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        ).then(response => {
            if (response.data.success && response.data.data.csrfToken) {
                csrfToken = response.data.data.csrfToken;
                return csrfToken;
            }
            return null;
        }).catch(error => {
            // Don't log rate limit errors (429) - they're expected during high load
            if (error.response?.status !== 429) {
                console.error("Failed to get CSRF token:", error);
            }
            return null;
        }).finally(() => {
            isFetchingCsrf = false;
            csrfTokenPromise = null;
        });
        
        return await csrfTokenPromise;
    } catch (error) {
        isFetchingCsrf = false;
        csrfTokenPromise = null;
        // Don't log rate limit errors
        if (error.response?.status !== 429) {
            console.error("Failed to get CSRF token:", error);
        }
        return null;
    }
};

// Request interceptor
// Helper function to check if a value is a Joi schema object
const isJoiSchemaObject = (value) => {
    if (!value || typeof value !== 'object') return false;
    // Check for Joi schema object indicators (most reliable indicators)
    // CRITICAL: Check for '$_root' first as it's the most reliable indicator
    // Also check for '$_temp', '$_terms', '$_super' which are Joi internal properties
    if ('$_root' in value) return true;
    if ('$_temp' in value) return true;
    if ('$_terms' in value) return true;
    if ('$_super' in value) return true;
    // Check for combination of Joi internal properties
    if ('_ids' in value && '_preferences' in value && '_rules' in value) return true;
    if ('_flags' in value && '_cache' in value) return true;
    // Check for type: 'array' with Joi schema properties (common pattern)
    if (value.type === 'array' && ('$_root' in value || '_root' in value)) return true;
    // Additional check: if it has both 'type' and Joi internal properties
    if (value.type && typeof value.type === 'string' && ('$_root' in value || '$_temp' in value)) return true;
    return false;
};

// Helper function to clean data from Joi schema objects
const cleanJoiSchemaObjects = (data) => {
    if (!data || typeof data !== 'object') return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => cleanJoiSchemaObjects(item)).filter(item => !isJoiSchemaObject(item));
    }
    
    // Handle objects - use Object.keys to avoid prototype chain issues
    const cleaned = {};
    const keys = Object.keys(data);
    
    for (const key of keys) {
        const value = data[key];
        
        // CRITICAL: Always remove categories if it's a Joi schema object OR not a valid array of strings
        // This is the most common issue - categories being a Joi schema object
        if (key === 'categories') {
            // Check if it's a Joi schema object using multiple methods
            // Method 1: Check for Joi-specific property names using Object.keys
            const valueKeys = Object.keys(value);
            const hasJoiKeys = valueKeys.some(k => 
                k === '$_root' || 
                k === '$_temp' || 
                k === '$_terms' || 
                k === '$_super' ||
                k === '_ids' ||
                k === '_preferences' ||
                k === '_rules' ||
                k === '_flags'
            );
            
            // Method 2: Check using 'in' operator (fallback)
            const hasJoiIn = (
                '$_root' in value ||
                '$_temp' in value ||
                '$_terms' in value ||
                '$_super' in value ||
                '_ids' in value ||
                '_preferences' in value ||
                '_rules' in value ||
                '_flags' in value
            );
            
            // Method 3: Check if it has type: 'array' with Joi properties
            const hasJoiType = value.type === 'array' && (hasJoiKeys || hasJoiIn);
            
            // Skip if it's a Joi object OR not a valid array OR not an array of strings
            if (hasJoiKeys || hasJoiIn || hasJoiType || !Array.isArray(value)) {
                // Skip this field entirely - don't include it in cleaned object
                continue;
            } else if (Array.isArray(value) && !value.every(item => typeof item === 'string')) {
                // Skip if it's not an array of strings
                continue;
            }
        }
        
        // Check if value is a Joi schema object (for any field)
        if (isJoiSchemaObject(value)) {
            // Skip Joi schema objects entirely
            continue;
        }
        
        // Recursively clean nested objects
        if (typeof value === 'object' && value !== null) {
            // Only recurse if it's not a Joi schema object (already checked above)
            cleaned[key] = cleanJoiSchemaObjects(value);
        } else {
            // Primitive values are safe
            cleaned[key] = value;
        }
    }
    
    return cleaned;
};

api.interceptors.request.use(
    async (config) => {
        // SECURITY: Validate endpoint before processing
        const endpoint = config.url || '';
        
        // Skip validation for null/undefined/empty endpoints (they will be handled by useQuery enabled option)
        if (!endpoint || endpoint.trim() === '') {
            return config;
        }
        
        if (!isValidEndpoint(endpoint)) {
            const error = new Error(`Unauthorized endpoint: ${endpoint}`);
            error.code = 'UNAUTHORIZED_ENDPOINT';
            return Promise.reject(error);
        }
        
        // For Next.js 15, we need to handle readonly config carefully
        // Use Object.assign to create a new config object instead of modifying the original
        
        // CRITICAL: Clean request data from Joi schema objects before sending
        // This must be done BEFORE creating the new config to ensure data is properly cleaned
        let cleanedData = config.data;
        if (cleanedData && typeof cleanedData === 'object' && !Array.isArray(cleanedData)) {
            // CRITICAL: Use JSON serialization to create a deep copy and strip non-serializable properties
            // This ensures we're working with a clean object and Joi schema objects are removed
            try {
                cleanedData = JSON.parse(JSON.stringify(cleanedData));
            } catch (e) {
                // If JSON serialization fails, fall back to shallow copy
                cleanedData = { ...cleanedData };
            }
            
            // CRITICAL: ALWAYS remove categories if it's not a valid array of strings
            // This is the ABSOLUTE first check - remove categories immediately if it's problematic
            // After JSON serialization, Joi objects should be gone, but check anyway
            if (cleanedData.categories) {
                const catValue = cleanedData.categories;
                
                // SIMPLEST CHECK: If it's not an array, delete it immediately
                if (!Array.isArray(catValue)) {
                    delete cleanedData.categories;
                } else {
                    // If it's an array, check for Joi properties
                    // Method 1: Check for Joi-specific property names using Object.keys
                    const keys = Object.keys(catValue);
                    const hasJoiKeys = keys.some(key => 
                        key === '$_root' || 
                        key === '$_temp' || 
                        key === '$_terms' || 
                        key === '$_super' ||
                        key === '_ids' ||
                        key === '_preferences' ||
                        key === '_rules' ||
                        key === '_flags'
                    );
                    
                    // Method 2: Check using 'in' operator (fallback)
                    const hasJoiIn = (
                        '$_root' in catValue ||
                        '$_temp' in catValue ||
                        '$_terms' in catValue ||
                        '$_super' in catValue ||
                        '_ids' in catValue ||
                        '_preferences' in catValue ||
                        '_rules' in catValue ||
                        '_flags' in catValue
                    );
                    
                    // Method 3: Check if it has type: 'array' with Joi properties
                    const hasJoiType = catValue.type === 'array' && (hasJoiKeys || hasJoiIn);
                    
                    // CRITICAL: Remove if it has ANY Joi properties OR is not an array of strings
                    if (hasJoiKeys || hasJoiIn || hasJoiType || !catValue.every(item => typeof item === 'string')) {
                        delete cleanedData.categories;
                    }
                }
            }
            
            // CRITICAL: Remove empty introVideo objects to prevent validation errors
            // introVideo must either have a valid url or not be included at all
            if (cleanedData.introVideo) {
                if (!cleanedData.introVideo.url || 
                    typeof cleanedData.introVideo.url !== 'string' || 
                    cleanedData.introVideo.url.trim() === "" ||
                    Object.keys(cleanedData.introVideo).length === 0) {
                    delete cleanedData.introVideo;
                }
            }
            
            // Clean Joi schema objects recursively from the rest of the data
            cleanedData = cleanJoiSchemaObjects(cleanedData);
            
            // CRITICAL: FINAL check - remove empty introVideo objects after all cleaning
            // This ensures introVideo is never sent as an empty object
            if (cleanedData.introVideo) {
                if (!cleanedData.introVideo.url || 
                    typeof cleanedData.introVideo.url !== 'string' || 
                    cleanedData.introVideo.url.trim() === "" ||
                    Object.keys(cleanedData.introVideo).length === 0) {
                    delete cleanedData.introVideo;
                }
            }
            
            // CRITICAL: ABSOLUTE FINAL check - remove categories if it's still problematic
            // This is the last resort check to ensure categories is NEVER sent as a Joi schema object
            if (cleanedData.categories) {
                const catValue = cleanedData.categories;
                
                // SIMPLEST CHECK: If it's not an array, delete it immediately
                if (!Array.isArray(catValue)) {
                    delete cleanedData.categories;
                } else {
                    // If it's an array, check for Joi properties
                    const keys = Object.keys(catValue);
                    const hasJoiKeys = keys.some(key => 
                        key === '$_root' || 
                        key === '$_temp' || 
                        key === '$_terms' || 
                        key === '$_super' ||
                        key === '_ids' ||
                        key === '_preferences' ||
                        key === '_rules' ||
                        key === '_flags'
                    );
                    const hasJoiIn = (
                        '$_root' in catValue ||
                        '$_temp' in catValue ||
                        '$_terms' in catValue ||
                        '$_super' in catValue ||
                        '_ids' in catValue ||
                        '_preferences' in catValue ||
                        '_rules' in catValue ||
                        '_flags' in catValue
                    );
                    const hasJoiType = catValue.type === 'array' && (hasJoiKeys || hasJoiIn);
                    
                    // CRITICAL: Remove if it has ANY Joi properties OR is not an array of strings
                    if (hasJoiKeys || hasJoiIn || hasJoiType || !catValue.every(item => typeof item === 'string')) {
                        delete cleanedData.categories;
                    }
                }
            }
        }
        
        // Create new headers object
        const newHeaders = { ...(config.headers || {}) };
        
        // SECURITY: Only allow safe headers to prevent header injection
        const safeHeaders = {
            "Content-Type": "application/json",
            "Accept-Language": "fa",
        };
        
        // Only allow specific safe headers
        const allowedHeaders = ['Authorization', 'X-CSRF-Token', 'Accept', 'Accept-Language'];
        Object.keys(newHeaders).forEach(key => {
            if (allowedHeaders.includes(key)) {
                safeHeaders[key] = newHeaders[key];
            }
        });
        
        const token = Cookies.get("token");
        if (token) {
            safeHeaders.Authorization = `Bearer ${token}`;
            
            // Add CSRF token for state-changing requests
            if (["POST", "PUT", "DELETE", "PATCH"].includes(config.method?.toUpperCase() || "")) {
                const csrf = await getCsrfToken();
                if (csrf) {
                    safeHeaders["X-CSRF-Token"] = csrf;
                }
            }
        }
        
        // Clone params if it exists to avoid readonly issues
        const clonedParams = config.params 
            ? (typeof config.params === 'object' && !Array.isArray(config.params) 
                ? { ...config.params } 
                : config.params)
            : undefined;
        
        // Create a new config object using Object.assign to avoid readonly property issues
        // This creates a shallow copy that we can safely modify
        const newConfig = Object.assign({}, config, {
            headers: safeHeaders,
            data: cleanedData, // CRITICAL: Use cleaned data instead of original
            ...(clonedParams !== undefined ? { params: clonedParams } : {}),
        });
        
        return newConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // Ignore network errors for logout endpoint (user is already logging out)
        const isLogoutRequest = error.config?.url?.includes('/auth/logout');
        const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
        
        if (isLogoutRequest && isNetworkError) {
            // Silently ignore network errors for logout
            return Promise.reject(error);
        }

        const message = error.response?.data?.message || "خطایی رخ داده است";

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            Cookies.remove("token");
            csrfToken = null;
            if (typeof window !== "undefined" && !window.location.pathname.includes("/auth/login")) {
                window.location.href = "/auth/login";
            }
            return Promise.reject(error);
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            // Check if it's a CSRF token issue
            const isCsrfError = error.response?.data?.message?.includes("CSRF") || 
                               error.response?.data?.message?.includes("csrf") ||
                               error.response?.data?.message?.includes("CSRF token");
            
            if (isCsrfError) {
                // Reset CSRF token to fetch a new one
                csrfToken = null;
                csrfTokenPromise = null;
                
                // Retry the request once with a fresh CSRF token
                const originalRequest = error.config;
                if (originalRequest && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    try {
                        // Get a fresh CSRF token
                        const freshCsrf = await getCsrfToken();
                        if (freshCsrf && originalRequest.headers) {
                            originalRequest.headers['X-CSRF-Token'] = freshCsrf;
                            // Retry the request
                            return api(originalRequest);
                        }
                    } catch (retryError) {
                        // If retry fails, show error
                        toast.error("خطای امنیتی. لطفاً صفحه را رفرش کنید.");
                        return Promise.reject(retryError);
                    }
                }
                
                toast.error("خطای امنیتی. لطفاً دوباره تلاش کنید.");
                return Promise.reject(error);
            }
            
            // For other 403 errors (like dashboard access), silently handle
            // Don't show toast for auth-related 403s (they're expected)
            const isAuthEndpoint = error.config?.url?.includes('/auth/');
            if (isAuthEndpoint) {
                // Silently handle auth-related 403s (like /auth/me without proper access)
                Cookies.remove("token");
                csrfToken = null;
                return Promise.reject(error);
            }
            
            // For non-auth 403s, show error
            toast.error(message || "شما دسترسی به این بخش ندارید");
            return Promise.reject(error);
        }

        // Handle 409 Conflict (e.g., file in use)
        if (error.response?.status === 409) {
            // Show detailed error message for conflict errors (like file in use)
            toast.error(message || "تداخل در داده‌ها");
            return Promise.reject(error);
        }

        // Show error toast (but not for network errors on logout or auth errors)
        if (error.response?.status !== 401 && error.response?.status !== 403 && !(isLogoutRequest && isNetworkError)) {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;
