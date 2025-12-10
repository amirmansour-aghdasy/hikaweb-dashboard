"use client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import createCache from "@emotion/cache";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useEffect, useState } from "react";
import { useUIStore } from "../store/useUIStore";
import PWAInstallPrompt from "../components/ui/PWAInstallPrompt";
import ClientOnlyToaster from "../components/ui/ClientOnlyToaster";

// Create RTL cache only on client-side to avoid hydration mismatch
function createEmotionCache() {
    return createCache({
        key: "muirtl",
        stylisPlugins: [prefixer, rtlPlugin],
        prepend: true,
    });
}

// Theme configuration function
const getTheme = (mode) =>
    createTheme({
        direction: "rtl",
        palette: {
            mode,
            primary: {
                main: "#005756",
                light: "#008987",
                dark: "#0E443C",
            },
            secondary: {
                main: "#dc004e",
            },
            background: {
                default: mode === "dark" ? "#121212" : "#E2E8F0",
                paper: mode === "dark" ? "#1E1E1E" : "#F1F1F1",
            },
            text: {
                primary: mode === "dark" ? "#FFFFFF" : "#212121",
                secondary: mode === "dark" ? "#B0B0B0" : "#757575",
            },
            divider: mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
        },
        typography: {
            fontFamily: "IRANSans",
            h1: { fontSize: "2.5rem", fontWeight: 600 },
            h2: { fontSize: "2rem", fontWeight: 600 },
            h3: { fontSize: "1.5rem", fontWeight: 600 },
            h4: { fontSize: "1.25rem", fontWeight: 600 },
            h5: { fontSize: "1.125rem", fontWeight: 600 },
            h6: { fontSize: "1rem", fontWeight: 600 },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        scrollbarWidth: "thin",
                        "&::-webkit-scrollbar": {
                            width: "8px",
                        },
                        "&::-webkit-scrollbar-track": {
                            background: mode === "dark" ? "#1E1E1E" : "#f1f1f1",
                        },
                        "&::-webkit-scrollbar-thumb": {
                            background: mode === "dark" ? "#555" : "#c1c1c1",
                            borderRadius: "4px",
                            "&:hover": {
                                background: mode === "dark" ? "#777" : "#a1a1a1",
                            },
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 500,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: "12px",
                        boxShadow:
                            mode === "dark"
                                ? "0 2px 8px rgba(0,0,0,0.3)"
                                : "0 2px 8px rgba(0,0,0,0.1)",
                    },
                },
            },
            MuiDataGrid: {
                styleOverrides: {
                    root: {
                        borderRadius: "12px",
                        border: "none",
                        "& .MuiDataGrid-cell": {
                            borderBottom:
                                mode === "dark"
                                    ? "1px solid rgba(255, 255, 255, 0.12)"
                                    : "1px solid #f0f0f0",
                        },
                        "& .MuiDataGrid-columnHeaders": {
                            borderBottom:
                                mode === "dark"
                                    ? "1px solid rgba(255, 255, 255, 0.12)"
                                    : "1px solid #f0f0f0",
                        },
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: mode === "dark" ? "#1E1E1E" : "#FFFFFF",
                        color: mode === "dark" ? "#FFFFFF" : "#212121",
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: mode === "dark" ? "#1E1E1E" : "#FFFFFF",
                        borderRight: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.12)" : "none",
                    },
                },
            },
            MuiMenu: {
                styleOverrides: {
                    paper: {
                        backgroundColor: mode === "dark" ? "#1E1E1E" : "#FFFFFF",
                    },
                },
            },
        },
    });

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 3,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

export function Providers({ children }) {
    const darkMode = useUIStore((state) => state.darkMode);
    const theme = useMemo(() => getTheme(darkMode ? "dark" : "light"), [darkMode]);
    const [mounted, setMounted] = useState(false);
    
    // Create cache only on client-side to avoid hydration mismatch
    const emotionCache = useMemo(() => {
        // Only create cache on client-side
        if (typeof window !== 'undefined') {
            return createEmotionCache();
        }
        return null;
    }, []);

    // Mark component as mounted (client-side only)
    useEffect(() => {
        setMounted(true);
    }, []);

    // Update document class and meta theme-color for dark mode
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        if (darkMode) {
            document.documentElement.classList.add("dark");
            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#121212");
        } else {
            document.documentElement.classList.remove("dark");
            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#005756");
        }
    }, [darkMode]);

    // Don't render until cache is ready (client-side only)
    if (!emotionCache) {
        return <>{children}</>;
    }

    return (
        <CacheProvider value={emotionCache}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <QueryClientProvider client={queryClient}>
                    {children}
                    {mounted && (
                        <>
                            <PWAInstallPrompt />
                        </>
                    )}
                    <ClientOnlyToaster />
                </QueryClientProvider>
            </ThemeProvider>
        </CacheProvider>
    );
}
