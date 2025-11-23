"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { ALLOWED_ROLES } from "@/lib/constants";

export default function AuthLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const hasRedirected = useRef(false);

    useEffect(() => {
        if (hasRedirected.current) return;

        if (!loading && user) {
            // Check if user has dashboard access before redirecting
            const userRole = user.role?.name || user.role;
            if (ALLOWED_ROLES.includes(userRole)) {
                hasRedirected.current = true;
                router.push("/dashboard");
            } else {
                // User doesn't have dashboard access - don't redirect
                // They should see the login page or an error message
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="background.default">
                <CircularProgress />
            </Box>
        );
    }

    if (user) {
        return null;
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "background.default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Container maxWidth="sm">{children}</Container>
        </Box>
    );
}
