import localFont from "next/font/local";

export const iranSanse = localFont({
    src: [
        {
            path: "../../../public/fonts/IRANSansXFaNum-Bold.woff",
            weight: "700",
            style: "bold",
        },
        {
            path: "../../../public/fonts/IRANSansXFaNum-Bold.woff2",
            weight: "700",
            style: "bold",
        },
        {
            path: "../../../public/fonts/IRANSansXFaNum-Regular.woff",
            weight: "400",
            style: "normal",
        },
        {
            path: "../../../public/fonts/IRANSansXFaNum-Regular.woff2",
            weight: "400",
            style: "normal",
        },
    ],
});
