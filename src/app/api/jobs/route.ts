import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const q = searchParams.get('q') || '';
    const location = searchParams.get('location');
    const score = searchParams.get('score');
    const jobStatus = searchParams.get('jobStatus') || 'active';
    const sortKey = searchParams.get('sort') || 'date';
    const sortDir = (searchParams.get('dir') || 'desc') as 'asc' | 'desc';
    
    // Build the query
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .gte('cfo_score', 1); // Only jobs with score >= 1
    
    // Apply filters
    if (q) {
      query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%`);
    }
    
    if (location) {
      const locations = location.split(',').map(l => l.trim());
      query = query.in('region', locations);
    }
    
    if (score) {
      const scores = score.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      if (scores.length > 0) {
        query = query.in('cfo_score', scores);
      }
    }
    
    if (jobStatus === 'expired') {
      query = query.lt('publication_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    }
    
    // Apply sorting
    if (sortKey === 'score') {
      query = query.order('cfo_score', { ascending: sortDir === 'asc' });
    } else if (sortKey === 'company') {
      query = query.order('company', { ascending: sortDir === 'asc' });
    } else if (sortKey === 'title') {
      query = query.order('title', { ascending: sortDir === 'asc' });
    } else if (sortKey === 'location') {
      query = query.order('location', { ascending: sortDir === 'asc' });
    } else {
      // Default: sort by date
      query = query.order('publication_date', { ascending: sortDir === 'asc' });
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    const totalPages = Math.ceil((count || 0) / pageSize);
    
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages
      }
    });
    
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 