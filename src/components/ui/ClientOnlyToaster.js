"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useUIStore } from "@/store/useUIStore";

export default function ClientOnlyToaster() {
    const [mounted, setMounted] = useState(false);
    const darkMode = useUIStore((state) => state.darkMode);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 4000,
                style: {
                    background: darkMode ? "#2D2D2D" : "#363636",
                    color: "#fff",
                },
            }}
        />
    );
}

