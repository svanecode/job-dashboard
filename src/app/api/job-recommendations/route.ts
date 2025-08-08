import { NextRequest, NextResponse } from 'next/server';
import { getJobRecommendations } from '@/services/jobService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '5');
    const minScore = parseInt(searchParams.get('minScore') || '1');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID parameter is required' }, { status: 400 });
    }

    const params = {
      page,
      pageSize,
      minScore
    };

    const results = await getJobRecommendations(jobId, params);

    return NextResponse.json({
      success: true,
      data: results.data,
      pagination: {
        page: results.page,
        pageSize: results.pageSize,
        total: results.total,
        totalPages: results.totalPages
      },
      jobId
    });

  } catch (error) {
    console.error('Job recommendations API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      jobId, 
      page = 1,
      pageSize = 5,
      minScore = 1
    } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const params = {
      page,
      pageSize,
      minScore
    };

    const results = await getJobRecommendations(jobId, params);

    return NextResponse.json({
      success: true,
      data: results.data,
      pagination: {
        page: results.page,
        pageSize: results.pageSize,
        total: results.total,
        totalPages: results.totalPages
      },
      jobId
    });

  } catch (error) {
    console.error('Job recommendations API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 