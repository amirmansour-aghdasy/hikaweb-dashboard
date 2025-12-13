import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

// SECURITY: Whitelist of allowed API endpoints to prevent SSRF and RCE attacks
// Dashboard uses client-side axios, but we still validate endpoints for security
const ALLOWED_ENDPOINT_PATTERNS = [
    // Auth endpoints
    /^\/auth\//,
    // Analytics
    /^\/analytics\//,
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
];

/**
 * Validate endpoint to prevent SSRF and RCE attacks
 * @param {string} endpoint - API endpoint to validate
 * @returns {boolean} True if endpoint is allowed
 */
function isValidEndpoint(endpoint) {
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
        // Allow only safe query parameters (alphanumeric, dash, underscore, equals, ampersand)
        if (!/^[a-zA-Z0-9_\-=&]+$/.test(queryString)) {
            console.error(`[SECURITY] Blocked suspicious query string: ${endpoint}`);
            return false;
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
api.interceptors.request.use(
    async (config) => {
        // SECURITY: Validate endpoint before processing
        const endpoint = config.url || '';
        if (!isValidEndpoint(endpoint)) {
            const error = new Error(`Unauthorized endpoint: ${endpoint}`);
            error.code = 'UNAUTHORIZED_ENDPOINT';
            return Promise.reject(error);
        }
        
        // For Next.js 15, we need to handle readonly config carefully
        // Use Object.assign to create a new config object instead of modifying the original
        
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
            if (error.response?.data?.message?.includes("CSRF")) {
                csrfToken = null; // Reset CSRF token to fetch a new one
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
