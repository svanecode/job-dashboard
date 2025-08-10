import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseServer = () => {
  // In Next.js 14/15, cookies() is synchronous and safe to read in server code
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options?: Parameters<typeof cookieStore.set>[2]) => {
          // Use name/value/options signature to set cookies
          cookieStore.set(name, value, options);
        },
        remove: (name: string) => {
          // Next provides a delete helper for removing cookies
          cookieStore.delete(name);
        },
      },
    }
  );
};