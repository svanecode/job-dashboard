import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Log request details for debugging
  console.log('Middleware: Processing request:', {
    url: request.url,
    method: request.method,
    hasCookies: request.cookies.getAll().length > 0,
    cookieNames: request.cookies.getAll().map(c => c.name)
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value;
          console.log(`Middleware: Getting cookie ${name}:`, value ? 'exists' : 'missing');
          return value;
        },
        set(name: string, value: string, options: { [key: string]: any }) {
          const cookieOptions = {
            ...options,
            httpOnly: false, // Allow client-side access for auth
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? undefined : undefined // Use default domain
          };
          
          console.log(`Middleware: Setting cookie ${name}:`, { value: value ? 'exists' : 'missing', options: cookieOptions });
          
          // Set cookie on the response
          supabaseResponse.cookies.set({
            name,
            value,
            ...cookieOptions,
          });
        },
        remove(name: string, options: { [key: string]: any }) {
          const cookieOptions = {
            ...options,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 0,
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? undefined : undefined // Use default domain
          };
          
          console.log(`Middleware: Removing cookie ${name}`);
          
          // Remove cookie by setting empty value and immediate expiry
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...cookieOptions,
          });
        },
      },
      auth: {
        storageKey: 'supabase-auth', // Match the client configuration
        debug: process.env.NODE_ENV === 'development'
      }
    }
  );

  // Get session - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('Middleware: Auth user result:', { 
    hasUser: !!user, 
    userId: user?.id, 
    error: userError?.message 
  });
  
  // Only refresh if user exists and session is about to expire
  if (user) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Middleware: Session result:', { 
      hasSession: !!session, 
      expiresAt: session?.expires_at,
      error: sessionError?.message 
    });
    
    if (session && session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      console.log('Middleware: Session expiry check:', { 
        expiresAt: expiresAt.toISOString(), 
        now: now.toISOString(), 
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60) + ' minutes' 
      });
      
      // Refresh if session expires in less than 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('Middleware: Refreshing session');
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Middleware: Session refresh error:', refreshError);
        }
      }
    }
  }

  // Route protection: only allow unauthenticated access to login/sign-up and auth flows
  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith('/auth');
  const isLoginRoute = pathname === '/login';
  const isSignupRoute = pathname === '/signup';
  const isPublicAllowed = isAuthRoute || isLoginRoute || isSignupRoute;

  // Helper to create redirect response while preserving cookies set earlier
  const redirectWithCookies = (targetPath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    const redirectResponse = NextResponse.redirect(url);
    // Preserve cookies that may have been set by Supabase above
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  };

  // If not authenticated and trying to access a protected route → redirect to /login
  if (!user && !isPublicAllowed) {
    console.log('Middleware: Unauthenticated access to', pathname, '→ redirect /login');
    return redirectWithCookies('/login');
  }

  // If authenticated and on login/signup → redirect to home
  if (user && (isLoginRoute || isSignupRoute)) {
    console.log('Middleware: Authenticated user on auth page', pathname, '→ redirect /');
    return redirectWithCookies('/');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 