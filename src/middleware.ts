import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next()

    // Hent build information fra environment variabler
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'
    const cacheVersion = process.env.NEXT_PUBLIC_CACHE_VERSION || buildId
    const forceRefresh = process.env.NEXT_PUBLIC_FORCE_REFRESH === 'true'

    // Add version headers for debugging and cache management
    response.headers.set('X-App-Version', buildId)
    response.headers.set('X-Cache-Version', cacheVersion)
    response.headers.set('X-Build-Time', process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString())

    // Session refresh logik for beskyttede ruter
    if (request.nextUrl.pathname.startsWith('/api/') || 
        request.nextUrl.pathname.startsWith('/chat') ||
        request.nextUrl.pathname.startsWith('/insights') ||
        request.nextUrl.pathname.startsWith('/profile') ||
        request.nextUrl.pathname.startsWith('/admin')) {
      
      // Opret Supabase server client for session håndtering
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value)
                response.cookies.set(name, value, options)
              })
            }
          }
        }
      )

      try {
        // Tjek og forny session hvis nødvendigt
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session && !error) {
          // Tjek om session snart udløber (inden for 1 time)
          const expiresAt = new Date(session.expires_at! * 1000)
          const now = new Date()
          const timeUntilExpiry = expiresAt.getTime() - now.getTime()
          const oneHour = 60 * 60 * 1000

          if (timeUntilExpiry < oneHour) {
            console.log("Middleware: Session udløber snart, fornyer...")
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            
            if (!refreshError && refreshData.session) {
              console.log("Middleware: Session fornyet succesfuldt")
            }
          }
        }
      } catch (sessionError) {
        console.warn("Middleware: Session refresh fejlede:", sessionError)
      }

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
    } else if (request.nextUrl.pathname === '/') {
      // Hovedside - kort cache med mulighed for opdatering
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
  } catch (error) {
    console.error('Middleware error:', error);
    // Return default response if middleware fails
    return NextResponse.next();
  }
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