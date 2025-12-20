"use client";

import { useEffect, useState } from "react";

export default function ClientOnlyWrapper({ children, fallback = null }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Use a div wrapper with suppressHydrationWarning to prevent hydration mismatch
        return (
            <div suppressHydrationWarning>
                {fallback}
            </div>
        );
    }

    return <>{children}</>;
}

