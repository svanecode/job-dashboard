import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseServer = async () => {
  try {
    // Next.js 15 requires awaiting cookies()
    const cookieStore = await cookies();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    // Log available cookies for debugging
    const availableCookies = Array.from(cookieStore.getAll()).map(c => c.name);
    console.log('SupabaseServer: Available cookies:', availableCookies);

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          // Keep in sync with client and middleware
          storageKey: 'supabase-auth',
          debug: process.env.NODE_ENV === 'development',
        },
        cookies: {
          get(name: string) {
            const value = cookieStore.get(name)?.value;
            console.log(`SupabaseServer: Getting cookie ${name}:`, value ? 'exists' : 'missing');
            return value;
          },
          set(name: string, value: string, options: { [key: string]: any }) {
            try {
              console.log(`SupabaseServer: Setting cookie ${name}:`, { value: value ? 'exists' : 'missing', options });
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // ignore if called from a Server Component without mutable cookies
              console.log(`SupabaseServer: Could not set cookie ${name} (Server Component)`);
            }
          },
          remove(name: string, options: { [key: string]: any }) {
            try {
              console.log(`SupabaseServer: Removing cookie ${name}`);
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // ignore if called from a Server Component without mutable cookies
              console.log(`SupabaseServer: Could not remove cookie ${name} (Server Component)`);
            }
          },
        },
      }
    );
  } catch (error) {
    console.error('Supabase server connection error:', error);
    throw error;
  }
};