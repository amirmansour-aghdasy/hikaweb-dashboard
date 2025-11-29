import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // PWA configuration will be added by withPWA
};

const pwaConfig = withPWA({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        disableDevLogs: true,
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                handler: "CacheFirst",
                options: {
                    cacheName: "google-fonts",
                    expiration: {
                        maxEntries: 4,
                        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
                    },
                },
            },
            {
                urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
                handler: "StaleWhileRevalidate",
                options: {
                    cacheName: "static-font-assets",
                    expiration: {
                        maxEntries: 4,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },
            {
                urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
                handler: "StaleWhileRevalidate",
                options: {
                    cacheName: "static-image-assets",
                    expiration: {
                        maxEntries: 64,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                },
            },
            {
                urlPattern: /\/_next\/image\?url=.+$/i,
                handler: "StaleWhileRevalidate",
                options: {
                    cacheName: "next-image",
                    expiration: {
                        maxEntries: 64,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                },
            },
            {
                urlPattern: /\.(?:mp3|wav|ogg)$/i,
                handler: "CacheFirst",
                options: {
                    rangeRequests: true,
                    cacheName: "static-audio-assets",
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                },
            },
            {
                urlPattern: /\.(?:mp4)$/i,
                handler: "CacheFirst",
                options: {
                    rangeRequests: true,
                    cacheName: "static-video-assets",
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                },
            },
            {
                urlPattern: /\.(?:js)$/i,
                handler: "StaleWhileRevalidate",
                options: {
                    cacheName: "static-js-assets",
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                },
            },
            {
                urlPattern: /\.(?:css|less)$/i,
                handler: "StaleWhileRevalidate",
                options: {
                    cacheName: "static-style-assets",
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                },
            },
            {
                urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
                handler: "StaleWhileRevalidate",
                options: {
                    cacheName: "next-data",
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                },
            },
            {
                urlPattern: /\/api\/.*$/i,
                handler: "NetworkFirst",
                options: {
                    cacheName: "apis",
                    expiration: {
                        maxEntries: 16,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                    networkTimeoutSeconds: 10,
                },
            },
            {
                urlPattern: ({ request }) => request.destination === "document",
                handler: "NetworkFirst",
                options: {
                    cacheName: "documents",
                    expiration: {
                        maxEntries: 32,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                },
            },
        ],
    },
});

export default pwaConfig(nextConfig);
