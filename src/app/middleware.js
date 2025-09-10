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
        // Verify JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);

        return NextResponse.next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
