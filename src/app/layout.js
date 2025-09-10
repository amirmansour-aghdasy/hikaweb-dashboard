import { iranSanse } from "@/lib/fonts";
import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
    title: "داشبورد مدیریت هیکاوب",
    description: "پنل مدیریت آژانس دیجیتال مارکتینگ هیکاوب",
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="fa" dir="rtl">
            <body className={iranSanse.className} suppressHydrationWarning={true}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
