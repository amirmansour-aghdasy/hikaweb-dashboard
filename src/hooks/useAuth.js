import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useUIStore } from "../store/useUIStore";
import api from "../lib/api";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { ALLOWED_ROLES } from "../lib/constants";

// Global promise to prevent multiple simultaneous checkAuth calls
let checkAuthPromise = null;

export const useAuth = () => {
    const router = useRouter();
    const { 
        user, 
        token, 
        isAuthenticated, 
        loading, 
        hasCheckedAuth,
        isCheckingAuth,
        setUser, 
        setToken, 
        setLoading, 
        clearAuth, 
        updateUser,
        setHasCheckedAuth,
        setIsCheckingAuth
    } = useAuthStore();

    const { showSnackbar } = useUIStore();

    useEffect(() => {
        // Only check auth once globally (not per component)
        // Use getState() to get fresh values from store
        const state = useAuthStore.getState();
        if (state.hasCheckedAuth) return;
        
        const storedToken = Cookies.get("token");
        
        // If token exists in cookie, check auth on mount
        if (storedToken) {
            if (!state.token) {
                setToken(storedToken);
            }
            // Set loading only if user is not loaded yet
            // If user exists, keep loading false to show page immediately while refreshing in background
            if (!state.user) {
                setLoading(true);
            }
            // Only call checkAuth if not already checking
            if (!state.isCheckingAuth) {
                setHasCheckedAuth(true);
                checkAuth();
            }
        } else if (!storedToken && state.user) {
            // Token removed but user still in store - clear auth
            clearAuth();
            setHasCheckedAuth(true);
        } else if (!storedToken && !state.user) {
            // No token and no user - ensure loading is false
            setLoading(false);
            setHasCheckedAuth(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run once on mount

    const checkAuth = async () => {
        // If already checking, return the existing promise
        if (isCheckingAuth && checkAuthPromise) {
            return checkAuthPromise;
        }

        setIsCheckingAuth(true);
        checkAuthPromise = (async () => {
            try {
                setLoading(true);
                const token = Cookies.get("token");
                if (!token) {
                    setLoading(false);
                    setIsCheckingAuth(false);
                    checkAuthPromise = null;
                    return;
                }

                const response = await api.get("/auth/me");

                if (response.data.success) {
                    // Handle both old format { user } and new format (direct user)
                    const userData = response.data.data?.user || response.data.data;
                    setUser(userData);
                }
            } catch (error) {
                // Silently handle auth errors - don't log or show toasts
                // These are expected when user is not logged in or token is invalid
                if (error.response?.status === 401 || error.response?.status === 403) {
                    Cookies.remove("token");
                    clearAuth();
                    setHasCheckedAuth(false); // Reset so it can check again if token is restored
                } else if (error.response?.status !== 429) {
                    // Don't logout on rate limit errors, just ignore
                    // Only logout for unexpected errors (not rate limit)
                }
            } finally {
                setLoading(false);
                setIsCheckingAuth(false);
                checkAuthPromise = null;
            }
        })();

        return checkAuthPromise;
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await api.post("/auth/login", { email, password });

            if (response.data.success) {
                const { user, tokens } = response.data.data;
                const token = tokens.accessToken || tokens.token;

                if (!token) {
                    showSnackbar("خطا در دریافت توکن احراز هویت", "error");
                    return { success: false, message: "خطا در دریافت توکن" };
                }

                // Check if user has dashboard access
                const userRole = user.role?.name || user.role;
                
                if (!ALLOWED_ROLES.includes(userRole)) {
                    showSnackbar("شما دسترسی به پنل مدیریت ندارید", "error");
                    return { 
                        success: false, 
                        message: "شما دسترسی به پنل مدیریت ندارید" 
                    };
                }

                // Store token
                Cookies.set("token", token, { expires: 7 });
                setToken(token);
                setUser(user);

                showSnackbar("با موفقیت وارد شدید", "success");
                router.push("/dashboard");
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || "خطا در ورود";
            showSnackbar(message, "error");
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            // Don't log rate limit errors (429) - they're expected during high load
            // Also don't block logout on network errors
            if (error.response?.status !== 429 && error.code !== 'ERR_NETWORK') {
                console.error("Logout error:", error);
            }
        } finally {
            Cookies.remove("token");
            clearAuth();
            router.push("/auth/login");
            showSnackbar("با موفقیت خارج شدید", "info");
        }
    };

    const updateProfile = async (data) => {
        try {
            const response = await api.put("/auth/profile", data);

            if (response.data.success) {
                updateUser(response.data.data);
                showSnackbar("پروفایل با موفقیت به‌روزرسانی شد", "success");
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || "خطا در به‌روزرسانی پروفایل";
            showSnackbar(message, "error");
            return { success: false, message };
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const response = await api.put("/auth/change-password", {
                currentPassword,
                newPassword,
            });

            if (response.data.success) {
                showSnackbar("رمز عبور با موفقیت تغییر کرد", "success");
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || "خطا در تغییر رمز عبور";
            showSnackbar(message, "error");
            return { success: false, message };
        }
    };

    return {
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth,
        updateProfile,
        changePassword,
    };
};
