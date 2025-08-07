import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    // Get a sample job with embedding
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, embedding, cfo_score')
      .is('deleted_at', null)
      .not('embedding', 'is', null)
      .limit(3);
    
    if (error) {
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 });
    }

    const sampleJobs = jobs?.map(job => ({
      id: job.id,
      title: job.title,
      cfoScore: job.cfo_score,
      embeddingLength: job.embedding ? job.embedding.length : 0,
      embeddingSample: job.embedding ? job.embedding.slice(0, 5) : null
    })) || [];

    return NextResponse.json({
      sampleJobs,
      totalJobsWithEmbeddings: jobs?.length || 0
    });

  } catch (error) {
    console.error('Test embeddings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 