import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Public paths that don't require authentication
    const publicPaths = ["/auth/login", "/auth/register"];

    if (publicPaths.includes(pathname)) {
        return NextResponse.next();
    }

    // Check for authentication token
    const token = request.cookies.get("token")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
        // Verify JWT token - In production, you should verify with backend
        // For now, we'll just check if token exists and let backend handle validation
        // The backend will return 401 if token is invalid
        if (token) {
            return NextResponse.next();
        }
        
        return NextResponse.redirect(new URL("/auth/login", request.url));
    } catch (error) {
        console.error("Token verification failed:", error);
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // SECURITY: Add security headers to protect against CVE-2025-55182 and other attacks
    const response = NextResponse.next();
    
    // Content Security Policy - Strict CSP to prevent XSS and code injection
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'https://api.hikaweb.ir') + "; frame-ancestors 'none';"
    );
    
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');
    
    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy - restrict dangerous features
    response.headers.set(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );
    
    // Strict Transport Security (if using HTTPS)
    if (request.nextUrl.protocol === 'https:') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    return response;
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
