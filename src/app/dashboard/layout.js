"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Box, CircularProgress, Alert, Typography } from "@mui/material";

import { iranSanse } from "@/lib/fonts";
import { useAuth } from "../../hooks/useAuth";
import { ALLOWED_ROLES } from "@/lib/constants";
import Cookies from "js-cookie";

export default function DashboardLayout({ children }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (hasRedirected.current) return;

        if (!loading && !user) {
            hasRedirected.current = true;
            router.push("/auth/login");
            return;
        }

        // Check if user has dashboard access
        if (!loading && user) {
            const userRole = user.role?.name || user.role;
            if (!ALLOWED_ROLES.includes(userRole)) {
                // User doesn't have dashboard access - clear token and logout
                hasRedirected.current = true;
                Cookies.remove("token");
                logout();
                router.push("/auth/login");
            }
        }
    }, [user, loading, router, logout]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return null;
    }

    // Check access before rendering
    const userRole = user.role?.name || user.role;
    if (!ALLOWED_ROLES.includes(userRole)) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh" p={3}>
                <Alert severity="error" sx={{ maxWidth: 500 }}>
                    <Typography variant="h6" gutterBottom>
                        دسترسی محدود
                    </Typography>
                    <Typography>
                        شما دسترسی به پنل مدیریت ندارید. لطفاً با حساب کاربری مناسب وارد شوید.
                    </Typography>
                </Alert>
            </Box>
        );
    }

    return children;
}
