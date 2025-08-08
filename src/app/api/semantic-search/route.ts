import { NextRequest, NextResponse } from 'next/server';
import { searchJobsSemantic, searchJobsHybrid, searchJobsText } from '@/services/jobService';

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      searchType = 'hybrid',
      page = 1,
      pageSize = 20,
      matchThreshold = 0.78,
      minScore = 1,
      locationFilter,
      companyFilter
    } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const params = {
      page,
      pageSize: 30, // Get top 30 results
      matchThreshold: 0.01, // Very low threshold to get more results
      minScore: 0, // No minimum score filter
      locationFilter: locationFilter || undefined,
      companyFilter: companyFilter || undefined
    };

    let results;
    
    switch (searchType) {
      case 'semantic':
        results = await searchJobsSemantic(query, params);
        break;
      case 'hybrid':
        results = await searchJobsHybrid(query, params);
        break;
      case 'text':
        results = await searchJobsText(query, params);
        break;
      default:
        results = await searchJobsHybrid(query, params);
    }

    return NextResponse.json({
      success: true,
      data: results.data,
      pagination: {
        page: results.page,
        pageSize: results.pageSize,
        total: results.total,
        totalPages: results.totalPages
      },
      searchType,
      query
    });

  } catch (error) {
    console.error('Semantic search API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const searchType = searchParams.get('type') || 'hybrid';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const minScore = parseInt(searchParams.get('minScore') || '1');
    const locationFilter = searchParams.get('location');
    const companyFilter = searchParams.get('company');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const params = {
      page,
      pageSize: 30, // Get top 30 results
      matchThreshold: 0.01, // Very low threshold to get more results
      minScore: 0, // No minimum score filter
      locationFilter: locationFilter || undefined,
      companyFilter: companyFilter || undefined
    };

    let results;
    
    switch (searchType) {
      case 'semantic':
        results = await searchJobsSemantic(query, params);
        break;
      case 'hybrid':
        results = await searchJobsHybrid(query, params);
        break;
      case 'text':
        results = await searchJobsText(query, params);
        break;
      default:
        results = await searchJobsHybrid(query, params);
    }

    return NextResponse.json({
      success: true,
      data: results.data,
      pagination: {
        page: results.page,
        pageSize: results.pageSize,
        total: results.total,
        totalPages: results.totalPages
      },
      searchType,
      query
    });

  } catch (error) {
    console.error('Semantic search API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 