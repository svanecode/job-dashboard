import { createBrowserClient } from '@supabase/ssr';

let supabase: ReturnType<typeof createBrowserClient> | null = null;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    console.error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Ensure session persistence and align storage key with middleware/server
  supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase-auth',
      flowType: 'pkce',
      debug: false, // Deaktiver debug logging
      cookieOptions: {
        name: 'supabase-auth',
        lifetime: 60 * 60 * 8, // 8 timer
        domain: '',
        path: '/',
        sameSite: 'lax'
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'job-dashboard'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Don't throw here, let the application handle the null client
}

export { supabase }; 