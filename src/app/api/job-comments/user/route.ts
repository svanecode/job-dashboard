import { supabaseServer } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get comments for the user
    const { data: comments, error } = await supabase
      .from('job_comments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user comments:', error)
      return NextResponse.json({ error: 'Failed to fetch user comments' }, { status: 500 })
    }

    // Enrich with job information (company, title, url)
    const commentList = comments || []
    const uniqueJobIds = Array.from(new Set(commentList.map((c: any) => c.job_id).filter(Boolean)))

    let jobsById: Record<string, { company: string | null; title: string | null; job_url: string | null }> = {}
    if (uniqueJobIds.length > 0) {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('job_id, company, title, job_url')
        .in('job_id', uniqueJobIds)

      if (jobsError) {
        console.error('Error fetching jobs for comments enrichment:', jobsError)
      } else if (Array.isArray(jobsData)) {
        jobsById = jobsData.reduce((acc: any, j: any) => {
          acc[j.job_id] = { company: j.company ?? null, title: j.title ?? null, job_url: j.job_url ?? null }
          return acc
        }, {})
      }
    }

    const enriched = commentList.map((c: any) => {
      const job = jobsById[c.job_id] || { company: null, title: null, job_url: null }
      return {
        ...c,
        company: job.company ?? undefined,
        job_title: job.title ?? undefined,
        job_url: job.job_url ?? undefined,
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error in user comments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 