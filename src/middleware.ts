import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add cache busting headers for all requests
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  // Add version header for debugging
  response.headers.set('X-App-Version', '0.2.0')
  response.headers.set('X-Cache-Buster', Date.now().toString())

  // Force refresh for HTML pages
  if (request.nextUrl.pathname.endsWith('.html') || request.nextUrl.pathname === '/') {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
  }

  // Force refresh for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
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