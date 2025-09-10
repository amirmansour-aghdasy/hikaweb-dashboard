/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },
    images: {
        domains: ["localhost", "cdn.hikaweb.ir", "arvan-drive-url.com"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    env: {
        CUSTOM_KEY: process.env.CUSTOM_KEY,
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/dashboard",
                permanent: false,
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: "/api/v1/:path*",
                destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
            },
        ];
    },
};

export default nextConfig;
