import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
  '/verify-2fa',
]

// Routes that are restricted to admins only (not hub managers)
const adminOnlyRoutes = [
  '/admins',
  '/settings',
  '/system-logs',
  // Add other admin-only routes here
]

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value
  const userRole = request.cookies.get('user_role')?.value
  const { pathname } = request.nextUrl

  // 1. Handle Public Routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If user is already logged in, redirect to dashboard
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // 2. Handle Authentication
  if (!token) {
    // Redirect to login if not authenticated
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // 3. Handle Role-Based Access Control
  // If user is a Hub Manager, restrict access to admin-only routes
  if (userRole === 'hub_manager') {
    if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
      // Redirect to dashboard or access denied page
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
