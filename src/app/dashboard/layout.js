"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Box, CircularProgress } from "@mui/material";

import { iranSanse } from "@/lib/fonts";
import { useAuth } from "../../lib/auth";

export default function DashboardLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
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

    return children;
}
