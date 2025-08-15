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

    const minScore = filters.minScore ?? 1;
    if (minScore > 0) q = q.gte('cfo_score', minScore);
    if (filters.score?.length) q = q.in('cfo_score', filters.score);
    if (filters.location?.length) {
      // RETTELSE: Brug .filter() med 'cs' (contains) på 'region'-kolonnen.
      // Dette matcher nu logikken i jobQuery.ts.
      q = q.filter('region', 'cs', `{${filters.location.join(',')}}`);
    }
    if (filters.dateFrom) q = q.gte('publication_date', filters.dateFrom);
    if (filters.dateTo) q = q.lte('publication_date', filters.dateTo);
    if (filters.q?.trim()) {
      const term = filters.q.trim();
      q = q.or(`title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
    }

    if (sort.key === 'score') {
      q = q.order('cfo_score', { ascending: sort.dir === 'asc' })
           .order('publication_date', { ascending: false });
    } else if (sort.key === 'date') {
      q = q.order('publication_date', { ascending: sort.dir === 'asc' });
    } else {
      const field =
        sort.key === 'company' ? 'company' :
        sort.key === 'title' ? 'title' :
        sort.key === 'location' ? 'location' : 'publication_date';
      q = q.order(field, { ascending: sort.dir === 'asc' });
    }

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    const { data, count, error } = await q.range(from, to);
    if (error) {
      console.error('SSR jobs error:', error);
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const total = count ?? 0;
    return {
      data: data ?? [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / (pageSize || 1)),
    };
  } catch (error) {
    console.error('SSR jobs connection error:', error);
    // Return empty data on connection errors to prevent SSR failures
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }
} 