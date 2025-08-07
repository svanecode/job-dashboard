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
      .gte('cfo_score', 1)
      .limit(1);
    
    if (error) {
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs with embeddings and CFO score >= 1' });
    }

    const job = jobs[0];
    
    // Test direct vector operation
    const { data: directResult, error: directError } = await supabase
      .from('jobs')
      .select('id, title, cfo_score')
      .is('deleted_at', null)
      .gte('cfo_score', 1)
      .not('embedding', 'is', null)
      .order(`embedding <=> '[${new Array(1536).fill(0.1).join(',')}]'`)
      .limit(3);

    return NextResponse.json({
      sampleJob: {
        id: job.id,
        title: job.title,
        cfoScore: job.cfo_score,
        embeddingLength: job.embedding ? job.embedding.length : 0
      },
      directVectorTest: {
        success: !directError,
        error: directError?.message || null,
        results: directResult?.length || 0
      }
    });

  } catch (error) {
    console.error('Test vector error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 