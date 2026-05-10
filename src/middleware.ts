import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_change_me");

// Add routes that don't require authentication here
const publicRoutes = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow static files, Next.js internal routes, and public routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        publicRoutes.includes(pathname)
    ) {
        return NextResponse.next();
    }

    // Check for the auth cookie
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
        // Redirect to login if no token is found and trying to access a protected route
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // Verify the JWT token
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.next();
    } catch (error) {
        console.error('JWT Verification failed:', error);
        // If token is invalid/expired, clear it and redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('admin_token');
        return response;
    }
}

export const config = {
    // Apply middleware to all routes except the ones matching the regex
    matcher: ['/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico).*)'],
};
