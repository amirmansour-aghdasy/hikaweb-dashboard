"use client";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/lib/auth";

export default function Layout({ children }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
    const { loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                Loading...
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: "background.default",
                    display: "flex",
                    flexDirection: "column",
                    transition: theme.transitions.create(["margin"], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    ...(sidebarOpen &&
                        !isMobile && {
                            margin: "0 100px",
                        }),
                }}
            >
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
                <Box
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        mt: 8,
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
}
