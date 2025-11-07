"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Box, CircularProgress, Alert, Typography } from "@mui/material";

import { iranSanse } from "@/lib/fonts";
import { useAuth } from "../../lib/auth";

// Allowed roles for dashboard access
const ALLOWED_ROLES = ["super_admin", "admin", "editor", "moderator"];

export default function DashboardLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
            return;
        }

        // Check if user has dashboard access
        if (!loading && user) {
            const userRole = user.role?.name || user.role;
            if (!ALLOWED_ROLES.includes(userRole)) {
                // User doesn't have dashboard access
                router.push("/auth/login");
            }
        }
    }, [user, loading, router]);

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
