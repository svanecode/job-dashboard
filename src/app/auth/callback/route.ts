import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Handle errors
  if (error) {
    console.error('Auth error:', error, error_description);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${error}&description=${error_description}`);
  }

  if (code) {
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

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=session_error`);
    }

    // Check if this is a password reset or email confirmation
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if this is a password reset (user has password but needs to update it)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.provider === 'email' && !session?.user?.user_metadata?.email_confirmed_at) {
        // This is likely a password reset, redirect to update password
        return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`);
      } else {
        // This is likely an email confirmation, redirect to login with success message
        return NextResponse.redirect(`${requestUrl.origin}/login?message=email_confirmed`);
      }
    }
  }

  // Default redirect to login page
  return NextResponse.redirect(`${requestUrl.origin}/login`);
} 