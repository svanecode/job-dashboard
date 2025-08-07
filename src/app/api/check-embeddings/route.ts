import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    // Check embeddings status
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, embedding, cfo_score')
      .is('deleted_at', null)
      .limit(20);
    
    if (error) {
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 });
    }

    const jobsWithEmbeddings = jobs?.filter(job => job.embedding !== null) || [];
    const jobsWithoutEmbeddings = jobs?.filter(job => job.embedding === null) || [];

    // Test official semantic search function
    const { data: vectorResults, error: vectorError } = await supabase.rpc('match_jobs_semantic', {
      query_embedding: new Array(1536).fill(0.1),
      match_threshold: 0.1,
      match_count: 5
    });

    return NextResponse.json({
      totalJobs: jobs?.length || 0,
      jobsWithEmbeddings: jobsWithEmbeddings.length,
      jobsWithoutEmbeddings: jobsWithoutEmbeddings.length,
      vectorSearchWorks: !vectorError && vectorResults && vectorResults.length > 0,
      vectorError: vectorError?.message || null,
      sampleJobsWithEmbeddings: jobsWithEmbeddings.slice(0, 3).map(job => ({
        title: job.title,
        cfoScore: job.cfo_score
      })),
      sampleJobsWithoutEmbeddings: jobsWithoutEmbeddings.slice(0, 3).map(job => ({
        title: job.title,
        cfoScore: job.cfo_score
      })),
      vectorResults: vectorResults?.slice(0, 3).map(job => ({
        title: job.title,
        similarity: job.similarity
      })) || []
    });

  } catch (error) {
    console.error('Check embeddings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 