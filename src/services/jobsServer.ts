import { supabaseServer } from '@/lib/supabase/server';
import type { BaseFilters, SortConfig } from './jobQuery';

// Select all columns to avoid column-mismatch errors across environments (e.g., when `region` is present)
const SELECT_COLUMNS = '*';

export async function getJobsFirstPageServer(
  filters: BaseFilters = {},
  sort: SortConfig = { key: 'score', dir: 'desc' },
  page = 1,
  pageSize = 20
) {
  try {
    const sb = await supabaseServer();

    let q = sb
      .from('jobs')
      .select(SELECT_COLUMNS, { count: 'exact' })
      .is('deleted_at', null);
      
    // Søgning
    if (filters.q?.trim()) {
        const term = filters.q.trim();
        q = q.or(`title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
    }

    // Score filter
    if (filters.score?.length) {
        q = q.in('cfo_score', filters.score);
    } else {
        q = q.gte('cfo_score', filters.minScore ?? 1);
    }
    
    // Location (Region) filter - RETTET til 'ov'
    if (filters.location?.length) {
      q = q.filter('region', 'ov', `{${filters.location.join(',')}}`);
    }
    
    // Date filters
    if (filters.dateFrom) {
        q = q.gte('publication_date', filters.dateFrom);
    }
    if (filters.dateTo) {
        q = q.lte('publication_date', filters.dateTo);
    }
    if (filters.daysAgo) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.daysAgo);
        q = q.gte('publication_date', cutoffDate.toISOString().split('T')[0]);
    }

    // Sorting
    if (sort.key === 'score') {
        q = q.order('cfo_score', { ascending: sort.dir === 'asc' });
    } else if (sort.key === 'date') {
        q = q.order('publication_date', { ascending: sort.dir === 'asc' });
    } else if (sort.key === 'company') {
        q = q.order('company', { ascending: sort.dir === 'asc' });
    } else if (sort.key === 'title') {
        q = q.order('title', { ascending: sort.dir === 'asc' });
    } else if (sort.key === 'location') {
        q = q.order('location', { ascending: sort.dir === 'asc' });
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);

    const { data, error, count } = await q;

    if (error) {
        console.error('Error fetching jobs:', error);
        throw error;
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
        data: data || [],
        total: count || 0,
        totalPages,
        page,
        pageSize,
    };
  } catch (error) {
    console.error('Error in getJobsFirstPageServer:', error);
    throw error;
  }
} 