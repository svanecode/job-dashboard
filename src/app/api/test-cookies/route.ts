import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Get all cookies
    const allCookies = cookieStore.getAll();
    
    return NextResponse.json({ 
      success: true,
      session: session ? 'exists' : 'none',
      cookies: allCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value ? 'set' : 'empty',
        path: cookie.path,
        maxAge: cookie.maxAge
      })),
      supabaseCookies: allCookies.filter(cookie => 
        cookie.name.startsWith('sb-') || 
        cookie.name.includes('supabase')
      ).map(cookie => cookie.name)
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 