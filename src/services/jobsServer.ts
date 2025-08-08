import { supabaseServer } from '@/lib/supabase/server';
import type { BaseFilters, SortConfig } from './jobQuery';

export async function getJobsFirstPageServer(
  filters: BaseFilters = {},
  sort: SortConfig = { key: 'score', dir: 'desc' },
  page = 1,
  pageSize = 20
) {
  const sb = await supabaseServer();

  let q = sb
    .from('jobs')
    .select('id, title, company, location, publication_date, description, cfo_score, job_url', { count: 'exact' })
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

  switch (sort.key) {
    case 'score':
      q = q.order('cfo_score', { ascending: sort.dir === 'asc' })
           .order('publication_date', { ascending: false });
      break;
    case 'company':  q = q.order('company',   { ascending: sort.dir === 'asc' }); break;
    case 'title':    q = q.order('title',     { ascending: sort.dir === 'asc' }); break;
    case 'location': q = q.order('location',  { ascending: sort.dir === 'asc' }); break;
    case 'date':
    default:         q = q.order('publication_date', { ascending: sort.dir === 'asc' }); break;
  }

  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const { data, count, error } = await q.range(from, to);
  if (error) throw error;

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / (pageSize || 1)),
  };
} 