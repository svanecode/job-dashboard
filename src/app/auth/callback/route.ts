import { supabaseServer } from '@/lib/supabase/server';
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
    try {
      const supabase = await supabaseServer();
      
      console.log('Auth callback: Exchanging code for session');
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return NextResponse.redirect(`${requestUrl.origin}/login?error=session_error`);
      }

      console.log('Auth callback: Session exchange successful:', { 
        hasSession: !!data.session, 
        userId: data.session?.user?.id 
      });

      // Verify session was created
      if (!data.session) {
        console.error('Auth callback: No session created after code exchange');
        return NextResponse.redirect(`${requestUrl.origin}/login?error=session_error`);
      }

      // Check if this is a password reset or email confirmation
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Auth callback: User authenticated:', user.id);
        
        // Check if this is a password reset (user has password but needs to update it)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.app_metadata?.provider === 'email' && !session?.user?.user_metadata?.email_confirmed_at) {
          // This is likely a password reset, redirect to update password
          console.log('Auth callback: Redirecting to password update');
          return NextResponse.redirect(`${requestUrl.origin}/auth/update-password`);
        } else {
          // This is likely an email confirmation, redirect to login with success message
          console.log('Auth callback: Redirecting to login with success message');
          return NextResponse.redirect(`${requestUrl.origin}/login?message=email_confirmed`);
        }
      } else {
        console.error('Auth callback: No user found after session exchange');
        return NextResponse.redirect(`${requestUrl.origin}/login?error=session_error`);
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=session_error`);
    }
  }

  // Default redirect to login page
  return NextResponse.redirect(`${requestUrl.origin}/login`);
} 