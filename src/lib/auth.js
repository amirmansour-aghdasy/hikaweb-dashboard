"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "./api";
import Cookies from "js-cookie";
import toast from "react-hot-toast"; // به جای useUIStore

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = Cookies.get("token");
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await api.get("/auth/me");
            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            if (error.response?.status === 401) {
                Cookies.remove("token");
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await api.post("/auth/login", { email, password });

            if (response.data.success) {
                const { user } = response.data.data;
                const { accessToken: token } = response.data.data.tokens;

                Cookies.set("token", token, {
                    expires: 7,
                    secure: false,
                    sameSite: "lax",
                    path: "/",
                });

                setUser(user);
                toast.success("با موفقیت وارد شدید");
                router.push("/dashboard");
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || "خطا در ورود";
            toast.error(message);
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
            setUser(null);
            router.push("/auth/login");
            toast.success("با موفقیت خارج شدید");
        }
    };

    const value = { user, loading, login, logout, checkAuth };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
