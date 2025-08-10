import { supabaseServer } from '@/lib/supabase/server';
import type { BaseFilters, SortConfig } from './jobQuery';

const SELECT_COLUMNS =
  'id, job_id, title, company, location, publication_date, description, cfo_score, job_url';

export async function getJobsFirstPageServer(
  filters: BaseFilters = {},
  sort: SortConfig = { key: 'score', dir: 'desc' },
  page = 1,
  pageSize = 20
) {
  const sb = supabaseServer();

  let q = sb
    .from('jobs')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .is('deleted_at', null);

  const minScore = filters.minScore ?? 1;
  if (minScore > 0) q = q.gte('cfo_score', minScore);
  if (filters.score?.length) q = q.in('cfo_score', filters.score);
  if (filters.location?.length) q = q.in('location', filters.location);
  if (filters.dateFrom) q = q.gte('publication_date', filters.dateFrom);
  if (filters.dateTo) q = q.lte('publication_date', filters.dateTo);
  if (filters.q?.trim()) {
    const term = filters.q.trim();
    q = q.or(`title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (sort.key === 'score') {
    q = q.order('cfo_score', { ascending: sort.dir === 'asc' })
         .order('publication_date', { ascending: false });
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
} 