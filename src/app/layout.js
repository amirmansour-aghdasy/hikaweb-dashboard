import { iranSanse } from "@/lib/fonts";
import { Providers } from "./providers";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import "./globals.css";

export const metadata = {
    title: "داشبورد مدیریت هیکاوب",
    description: "پنل مدیریت آژانس دیجیتال مارکتینگ هیکاوب",
    manifest: "/manifest.json",
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "هیکاوب",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: "/favicon.ico",
        apple: "/icons/apple-touch-icon.png",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#1976d2",
};

export default function RootLayout({ children }) {
    return (
        <html lang="fa" dir="rtl">
            <body className={iranSanse.className} suppressHydrationWarning={true}>
                <Providers>
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </Providers>
            </body>
        </html>
    );
}
