import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Minimal cookie capture without console noise
    const allCookies = Array.from(cookieStore.getAll()).map(c => ({ name: c.name }));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.log('API: Error setting cookie:', error);
            }
          },
          remove(name: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.log('API: Error removing cookie:', error);
            }
          },
        },
        auth: {
          storageKey: 'supabase-auth'
        }
      }
    );
    
    // Try to get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Then try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      success: true,
      allCookies,
      sessionExists: !!session,
      sessionError: sessionError?.message,
      userAuthenticated: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userError: userError?.message
    })
  } catch (error) {
    console.error('Error in test-auth API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 