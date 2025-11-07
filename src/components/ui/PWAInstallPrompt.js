"use client";

import { useState, useEffect } from "react";
import { Box, Button, Snackbar, Alert, IconButton } from "@mui/material";
import { Close as CloseIcon, GetApp as GetAppIcon } from "@mui/icons-material";

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Check if running on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS) {
            // For iOS, show custom install instructions
            const hasShownIOSPrompt = localStorage.getItem("pwa-ios-prompt-shown");
            if (!hasShownIOSPrompt) {
                setShowInstallPrompt(true);
                localStorage.setItem("pwa-ios-prompt-shown", "true");
            }
            return;
        }

        // Listen for beforeinstallprompt event (Android/Chrome)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            const hasShownPrompt = localStorage.getItem("pwa-install-prompt-shown");
            if (!hasShownPrompt) {
                setShowInstallPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Check if app was just installed
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowInstallPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // For iOS, just close the prompt
            setShowInstallPrompt(false);
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
        localStorage.setItem("pwa-install-prompt-shown", "true");
    };

    const handleClose = () => {
        setShowInstallPrompt(false);
        localStorage.setItem("pwa-install-prompt-shown", "true");
    };

    if (isInstalled || !showInstallPrompt) {
        return null;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
        <Snackbar
            open={showInstallPrompt}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            onClose={handleClose}
        >
            <Alert
                severity="info"
                action={
                    <>
                        {!isIOS && (
                            <Button
                                color="inherit"
                                size="small"
                                onClick={handleInstallClick}
                                startIcon={<GetAppIcon />}
                                sx={{ mr: 1 }}
                            >
                                نصب
                            </Button>
                        )}
                        <IconButton
                            size="small"
                            aria-label="close"
                            color="inherit"
                            onClick={handleClose}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </>
                }
                sx={{
                    minWidth: "300px",
                    "& .MuiAlert-message": {
                        flex: 1,
                    },
                }}
            >
                {isIOS ? (
                    <Box>
                        <Box sx={{ mb: 1, fontWeight: "bold" }}>
                            برای نصب اپلیکیشن:
                        </Box>
                        <Box component="ol" sx={{ m: 0, pl: 2, fontSize: "0.875rem" }}>
                            <li>دکمه Share را در پایین صفحه فشار دهید</li>
                            <li>گزینه "Add to Home Screen" را انتخاب کنید</li>
                        </Box>
                    </Box>
                ) : (
                    "این اپلیکیشن را روی دستگاه خود نصب کنید تا دسترسی سریع‌تری داشته باشید."
                )}
            </Alert>
        </Snackbar>
    );
}

