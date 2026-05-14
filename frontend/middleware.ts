import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/upload', '/settings', '/my-videos', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Auth pages (/auth/login, /auth/register) are ALWAYS accessible —
  // even when logged in. The login page handles session cleanup on mount
  // to support account switching.

  // For admin routes, we would need to validate role
  // This would typically require fetching user data on the server
  if (pathname.startsWith('/admin')) {
    // Token validation happens here, role validation should happen on page level
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/upload',
    '/settings',
    '/my-videos',
    '/admin/:path*',
    '/auth/login',
    '/auth/register',
  ],
};
