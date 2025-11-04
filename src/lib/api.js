import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
    timeout: 30000,
    withCredentials: true, // Enable credentials for CORS
    headers: {
        "Content-Type": "application/json", 
        "Accept-Language": "fa",
    },
});

// CSRF Token Management
let csrfToken = null;

const getCsrfToken = async () => {
    if (csrfToken) return csrfToken;
    
    try {
        const token = Cookies.get("token");
        if (!token) return null;
        
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/auth/csrf-token`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        
        if (response.data.success && response.data.data.csrfToken) {
            csrfToken = response.data.data.csrfToken;
            return csrfToken;
        }
    } catch (error) {
        console.error("Failed to get CSRF token:", error);
    }
    
    return null;
};

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        // For Next.js 15, we need to handle readonly config carefully
        // Only modify what we need (headers) and preserve everything else
        
        // Create new headers object to avoid readonly issues
        const newHeaders = { ...(config.headers || {}) };
        
        const token = Cookies.get("token");
        if (token) {
            newHeaders.Authorization = `Bearer ${token}`;
            
            // Add CSRF token for state-changing requests
            if (["POST", "PUT", "DELETE", "PATCH"].includes(config.method?.toUpperCase() || "")) {
                const csrf = await getCsrfToken();
                if (csrf) {
                    newHeaders["X-CSRF-Token"] = csrf;
                }
            }
        }
        
        // Return config with new headers, but preserve all other properties
        // This ensures Axios can still handle data serialization correctly
        return {
            ...config,
            headers: newHeaders,
        };
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

        // Handle 403 Forbidden (CSRF token issue)
        if (error.response?.status === 403 && error.response?.data?.message?.includes("CSRF")) {
            csrfToken = null; // Reset CSRF token to fetch a new one
            toast.error("خطای امنیتی. لطفاً دوباره تلاش کنید.");
            return Promise.reject(error);
        }

        // Show error toast
        if (error.response?.status !== 401 && error.response?.status !== 403) {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;
