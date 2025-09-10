import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useUIStore } from "../store/useUIStore";
import api from "../lib/api";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export const useAuth = () => {
    const router = useRouter();
    const { user, token, isAuthenticated, loading, setUser, setToken, setLoading, clearAuth, updateUser } = useAuthStore();

    const { showSnackbar } = useUIStore();

    useEffect(() => {
        const storedToken = Cookies.get("token");
        if (storedToken && !token) {
            setToken(storedToken);
            checkAuth();
        }
    }, []);

    const checkAuth = async () => {
        try {
            setLoading(true);
            const response = await api.get("/auth/me");

            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await api.post("/auth/login", { email, password });

            if (response.success) {
                const { user, token } = response.data.data;

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
            console.error("Logout error:", error);
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
