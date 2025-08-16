import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Hent build information fra environment variabler
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'
  const cacheVersion = process.env.NEXT_PUBLIC_CACHE_VERSION || buildId
  const forceRefresh = process.env.NEXT_PUBLIC_FORCE_REFRESH === 'true'

  // Add version headers for debugging and cache management
  response.headers.set('X-App-Version', buildId)
  response.headers.set('X-Cache-Version', cacheVersion)
  response.headers.set('X-Build-Time', process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString())

  // Intelligente cache-strategier baseret på indholdstype
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // API routes - ingen cache for dynamisk indhold
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  } else if (request.nextUrl.pathname.startsWith('/_next/') || 
             request.nextUrl.pathname.includes('.') ||
             request.nextUrl.pathname === '/favicon.ico') {
    // Statiske filer - tillad lang cache med cache-busting
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    response.headers.set('X-Static-Asset', 'true')
  } else if (request.nextUrl.pathname === '/' ||
             request.nextUrl.pathname.startsWith('/chat') ||
             request.nextUrl.pathname.startsWith('/insights') ||
             request.nextUrl.pathname.startsWith('/profile') ||
             request.nextUrl.pathname.startsWith('/admin')) {
    // Dynamiske sider - kort cache med mulighed for opdatering
    if (forceRefresh) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    } else {
      response.headers.set('Cache-Control', 'public, max-age=300, must-revalidate') // 5 minutter
    }
    response.headers.set('X-Dynamic-Content', 'true')
  } else {
    // Andre sider - standard cache-strategi
    response.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate') // 1 time
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