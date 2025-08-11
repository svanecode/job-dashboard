import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Log available cookies for debugging
    console.log('API: Available cookies:', Array.from(cookieStore.getAll()).map(c => c.name));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            console.log(`API: Getting cookie ${name}:`, cookie?.value ? 'exists' : 'missing');
            return cookie?.value;
          },
          set(name: string, value: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        }
      }
    );
    
    // Try to get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('API: Session result:', { session: !!session, error: sessionError?.message });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('API: Auth result:', { user: user?.id, error: userError?.message });
    
    if (userError || !user) {
      console.log('API: Returning 401 - userError:', userError?.message, 'user:', !!user);
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: {
          sessionError: sessionError?.message,
          userError: userError?.message,
          sessionExists: !!session,
          userExists: !!user
        }
      }, { status: 401 })
    }

    // Check if we're looking for a specific job
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (jobId) {
      // Check if specific job is saved
      const { data: savedJob, error } = await supabase
        .from('saved_jobs')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking if job is saved:', error)
        return NextResponse.json({ error: 'Failed to check if job is saved' }, { status: 500 })
      }

      return NextResponse.json({ saved: !!savedJob })
    }

    // Get all saved jobs for the user
    const { data: savedJobs, error } = await supabase
      .rpc('get_saved_jobs', { user_uuid: user.id })

    if (error) {
      console.error('Error fetching saved jobs:', error)
      return NextResponse.json({ error: 'Failed to fetch saved jobs' }, { status: 500 })
    }

    return NextResponse.json(savedJobs)
  } catch (error) {
    console.error('Error in saved jobs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    console.log('API: Available cookies:', Array.from(cookieStore.getAll()).map(c => c.name));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            console.log(`API: Getting cookie ${name}:`, cookie?.value ? 'exists' : 'missing');
            return cookie?.value;
          },
          set(name: string, value: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: { [key: string]: any }) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        }
      }
    );
    
    // Try to get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('API: Session result:', { session: !!session, error: sessionError?.message });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('API: Auth result:', { user: user?.id, error: userError?.message });
    if (userError || !user) {
      console.log('API: Returning 401 - userError:', userError?.message, 'user:', !!user);
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: {
          sessionError: sessionError?.message,
          userError: userError?.message,
          sessionExists: !!session,
          userExists: !!user
        }
      }, { status: 401 })
    }

    const body = await request.json()
    const { job_id, notes } = body

    if (!job_id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Save the job
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({
        user_id: user.id,
        job_id,
        notes
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Job already saved' }, { status: 409 })
      }
      console.error('Error saving job:', error)
      return NextResponse.json({ error: 'Failed to save job' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in save job API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 