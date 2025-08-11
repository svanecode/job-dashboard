import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Log available cookies for debugging
    console.log('JobComments API: Available cookies:', Array.from(cookieStore.getAll()).map(c => c.name));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            console.log(`JobComments API: Getting cookie ${name}:`, cookie?.value ? 'exists' : 'missing');
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
    
    const { searchParams } = new URL(request.url)
    const job_id = searchParams.get('job_id')

    if (!job_id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Get comments for the job (visible to all users)
    const { data: comments, error } = await supabase
      .rpc('get_job_comments', { 
        job_id_param: job_id
      })

    if (error) {
      console.error('JobComments API: Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments', details: error }, { status: 500 })
    }

    return NextResponse.json(comments)
  } catch (error) {
    console.error('JobComments API: Error in job comments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    console.log('JobComments API: Available cookies:', Array.from(cookieStore.getAll()).map(c => c.name));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            console.log(`JobComments API: Getting cookie ${name}:`, cookie?.value ? 'exists' : 'missing');
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
    console.log('JobComments API: Session result:', { session: !!session, error: sessionError?.message });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('JobComments API: Auth result:', { user: user?.id, error: userError?.message });
    if (userError || !user) {
      console.log('JobComments API: Returning 401 - userError:', userError?.message, 'user:', !!user);
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
    const { job_id, comment } = body

    if (!job_id || !comment) {
      return NextResponse.json({ error: 'Job ID and comment are required' }, { status: 400 })
    }

    // Add the comment
    const { data, error } = await supabase
      .from('job_comments')
      .insert({
        user_id: user.id,
        job_id,
        comment
      })
      .select()
      .single()

    if (error) {
      console.error('JobComments API: Error adding comment:', error)
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('JobComments API: Error in add comment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 