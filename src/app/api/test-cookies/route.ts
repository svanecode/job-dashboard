import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies
    const allCookies = Array.from(cookieStore.getAll()).map(c => ({
      name: c.name,
      value: c.value ? 'exists' : 'missing',
      path: c.path,
      domain: c.domain
    }));
    
    // Get specific Supabase cookies
    const supabaseAuthCookie = cookieStore.get('supabase-auth');
    const supabaseCookies = {
      'sb-access-token': cookieStore.get('sb-access-token')?.value ? 'exists' : 'missing',
      'sb-refresh-token': cookieStore.get('sb-refresh-token')?.value ? 'exists' : 'missing',
      'supabase-auth-token': cookieStore.get('supabase-auth-token')?.value ? 'exists' : 'missing',
      'supabase-auth': supabaseAuthCookie?.value ? 'exists' : 'missing'
    };
    
    return NextResponse.json({
      success: true,
      allCookies,
      supabaseCookies,
      supabaseAuthValue: supabaseAuthCookie?.value ? supabaseAuthCookie.value.substring(0, 50) + '...' : 'missing',
      cookieCount: allCookies.length
    })
  } catch (error) {
    console.error('Error in test-cookies API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 