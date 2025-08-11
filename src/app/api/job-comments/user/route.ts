import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
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
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's comments with job details
    const { data, error } = await supabase
      .from('job_comments')
      .select(`
        id,
        comment,
        created_at,
        updated_at,
        job_id
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Get job details for each comment
    const commentsWithJobDetails = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: jobData } = await supabase
          .from('jobs')
          .select('title, company, job_url')
          .eq('job_id', comment.job_id)
          .single()

        return {
          id: comment.id,
          comment: comment.comment,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          job_id: comment.job_id,
          job_title: jobData?.title,
          job_url: jobData?.job_url,
          company: jobData?.company
        }
      })
    )

    return NextResponse.json(commentsWithJobDetails)
  } catch (error) {
    console.error('Error in user comments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 