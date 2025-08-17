import { supabase } from '@/lib/supabase';

export type SortKey = 'score' | 'date' | 'company' | 'title' | 'location' | 'comments' | 'saved';
export type SortDir = 'asc' | 'desc';
export type SortConfig = { key: SortKey; dir: SortDir };

export type BaseFilters = {
  q?: string;
  score?: number[];
  location?: string[];
  dateFrom?: string; // 'YYYY-MM-DD'
  dateTo?: string;   // 'YYYY-MM-DD'
  daysAgo?: number;  // Number of days ago from today
  minScore?: number; // default 1 (now handled in job status filter logic)
  jobStatus?: 'active' | 'expired'; // 'active' = Aktuelle (deleted_at IS NULL), 'expired' = Udløbede (deleted_at IS NOT NULL)
};

const SELECT_COLUMNS =
  'id, job_id, title, company, location, publication_date, created_at, description, cfo_score, job_url, region';

export function buildJobsQuery(filters: BaseFilters, sort: SortConfig) {
  let q = supabase
    .from('jobs')
    .select(SELECT_COLUMNS, { count: 'exact' });

  // Handle job status filter (Aktuelle vs Udløbede)
  console.log('🔍 Job status filter - jobStatus:', filters.jobStatus);
  
  if (filters.jobStatus === 'expired') {
    // Udløbede: Only soft deleted jobs with CFO score >= 1
    console.log('🔍 Filtering for UDLØBEDE jobs (soft deleted with CFO score >= 1)');
    // Try alternative approach if not() doesn't work
    try {
      q = q.not('deleted_at', null).gte('cfo_score', 1);
    } catch (error) {
      console.log('🔍 Fallback to raw SQL for soft deleted filter');
      // Alternative: use raw SQL if Supabase query builder fails
      q = q.filter('deleted_at', 'is not', null).gte('cfo_score', 1);
    }
  } else {
    // Aktuelle: Only active jobs with CFO score >= 1
    console.log('🔍 Filtering for AKTUELLE jobs (not deleted with CFO score >= 1)');
    q = q.is('deleted_at', null).gte('cfo_score', 1);
  }

  // Søgning
  if (filters.q?.trim()) {
    const term = filters.q.trim();
    q = q.or(`title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
  }

 // Score filter - only apply if we have specific score requirements
  if (filters.score?.length) {
    q = q.in('cfo_score', filters.score);
  }
  // Note: minScore is already handled in the soft deleted filter logic above
  
  // Location (Region) filter - bruger 'ov' for array-overlap
  if (filters.location?.length) {
    q = q.overlaps('region', filters.location);
  }

  // Date filters
  if (filters.dateFrom) {
    console.log(`🔍 Applying dateFrom filter: ${filters.dateFrom}`);
    q = q.gte('publication_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    console.log(`🔍 Applying dateTo filter: ${filters.dateTo}`);
    q = q.lte('publication_date', filters.dateTo);
  }
  // daysAgo håndteres nu i jobService.ts og konverteres til dateFrom

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
  // Bemærk: 'comments' og 'saved' sortering håndteres på klienten
  // da disse data ikke er tilgængelige i den primære jobs tabel

  console.log('🔍 Final query filters:', {
    jobStatus: filters.jobStatus,
    location: filters.location,
    score: filters.score,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  });

  return q;
}

export async function runPaged(
  query: ReturnType<typeof buildJobsQuery>,
  page = 1,
  pageSize = 20
) {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    console.log(`🔍 Running paged query: page ${page}, size ${pageSize}, range ${from}-${to}`);
    
    const { data, count, error } = await query.range(from, to);
    
    if (error) {
      console.error('Supabase query error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
    
    const total = count ?? 0;
    console.log(`🔍 Query successful: ${total} total jobs, ${data?.length || 0} returned`);
    
    return {
      data: data ?? [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / (pageSize || 1)),
    };
  } catch (err) {
    console.error('Unexpected error in runPaged:', err);
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
} 