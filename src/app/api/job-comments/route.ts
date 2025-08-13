import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Check if we're looking for a specific job
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Get comments for the job, including user name via RPC that joins public.users
    const { data: comments, error } = await supabase
      .rpc('get_job_comments', { job_id_param: jobId })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json(comments || [])
  } catch (error) {
    console.error('Error in job comments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { job_id, comment } = body

    if (!job_id || !comment) {
      return NextResponse.json({ error: 'Job ID and comment are required' }, { status: 400 })
    }

    // Add the comment
    const { data: inserted, error } = await supabase
      .from('job_comments')
      .insert({
        user_id: user.id,
        job_id,
        comment
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding comment:', error)
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
    }

    if (error) {
      console.error('Error adding comment:', error)
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
    }
    // Return the freshly inserted comment with user_name by reusing the RPC for a single id
    const { data: withUser } = await supabase
      .rpc('get_job_comments', { job_id_param: job_id })
    const enriched = Array.isArray(withUser) ? withUser.find((c: any) => c.id === inserted.id) : null
    return NextResponse.json(enriched || inserted)
  } catch (error) {
    console.error('Error in add comment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 