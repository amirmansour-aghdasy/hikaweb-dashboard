import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
        "Accept-Language": "fa",
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
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
    (error) => {
        const message = error.response?.data?.message || "خطایی رخ داده است";

        if (error.response?.status === 401) {
            if (error.config.url.includes("/auth/me")) {
                Cookies.remove("token");
                window.location.href = "/auth/login";
            }
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default api;
