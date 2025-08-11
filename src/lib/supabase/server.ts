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

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // ignore if called from a Server Component without mutable cookies
            }
          },
          remove(name: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // ignore if called from a Server Component without mutable cookies
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