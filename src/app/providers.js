"use client";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import createCache from "@emotion/cache";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import PWAInstallPrompt from "../components/ui/PWAInstallPrompt";

// RTL cache
const cacheRtl = createCache({
    key: "muirtl",
    stylisPlugins: [prefixer, rtlPlugin],
});

// Theme configuration
const theme = createTheme({
    direction: "rtl",
    palette: {
        mode: "light",
        primary: {
            main: "#005756",
            light: "#008987",
            dark: "#0E443C",
        },
        secondary: {
            main: "#dc004e",
        },
        background: {
            default: "#E2E8F0",
            paper: "#F1F1F1",
        },
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
                        background: "#f1f1f1",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: "#c1c1c1",
                        borderRadius: "4px",
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
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                },
            },
        },
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    borderRadius: "12px",
                    border: "none",
                    "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid #f0f0f0",
                    },
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
    return (
        <CacheProvider value={cacheRtl}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <QueryClientProvider client={queryClient}>
                    {children}
                    <PWAInstallPrompt />
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: "#363636",
                                color: "#fff",
                            },
                        }}
                    />
                </QueryClientProvider>
            </ThemeProvider>
        </CacheProvider>
    );
}
