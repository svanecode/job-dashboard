import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add version header for debugging
  response.headers.set('X-App-Version', '0.2.0')
  response.headers.set('X-Cache-Buster', Date.now().toString())

  // Force refresh for HTML pages, API routes, and dynamic content
  if (request.nextUrl.pathname.endsWith('.html') || 
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.startsWith('/chat') ||
      request.nextUrl.pathname.startsWith('/insights') ||
      request.nextUrl.pathname.startsWith('/profile')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    // Add cache-busting for dynamic pages
    response.headers.set('X-Dynamic-Content', 'true')
  } else {
    // Allow caching for static assets (CSS, JS, images, etc.)
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 