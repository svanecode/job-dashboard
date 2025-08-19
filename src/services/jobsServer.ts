// src/services/jobsServer.ts

import { supabaseServer } from '@/lib/supabase/server';
// Sørg for at dine type-definitioner er importeret korrekt
import type { BaseFilters, SortConfig } from './jobQuery'; 

export async function getJobsFirstPageServer(
  filters: BaseFilters = {},
  sort: SortConfig = { key: 'score', dir: 'desc' },
  page = 1,
  pageSize = 20
) {
  try {
    const sb = await supabaseServer();
    const offset = (page - 1) * pageSize;

    let query = sb
      .from('jobs')
      .select('*', { count: 'exact' });

    // 1. Statusfilter (Aktuelle vs. Udløbne)
    // Denne logik matcher nu din database-struktur perfekt.
    if (filters.jobStatus === 'expired') {
      // For "Udløbne" jobs, find dem hvor 'deleted_at' IKKE er null.
      // RETTELSE: Korrekt syntaks er .not('kolonne', 'is', null)
      query = query.not('deleted_at', 'is', null); 
    } else {
      // For "Aktuelle" jobs (standard), find dem hvor 'deleted_at' ER null.
      query = query.is('deleted_at', null);
    }

    // Tilføj altid cfo_score filteret efter status
    query = query.gte('cfo_score', 1);
    
    // 2. Søgefilter (hvis det findes)
    if (filters.q?.trim()) {
      const term = filters.q.trim();
      // Bruger .or() til at søge i flere kolonner inklusive location og description
      query = query.or(`title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
    }
    
    // 3. Lokationsfilter (hvis det findes)
    if (filters.location?.length) {
      query = query.overlaps('region', filters.location);
    }

    // 4. Datofilter (hvis det findes)
    if (filters.dateFrom) {
      query = query.gte('publication_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('publication_date', filters.dateTo);
    }
    if (filters.daysAgo) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.daysAgo);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
      query = query.gte('publication_date', cutoffDateStr);
    }

    // 5. Score filter (hvis det findes)
    if (filters.score?.length) {
      query = query.in('cfo_score', filters.score);
    }

    // 6. Sortering
    if (sort.key === 'score') {
      query = query.order('cfo_score', { ascending: sort.dir === 'asc' });
    } else if (sort.key === 'date') {
      query = query.order('publication_date', { ascending: sort.dir === 'asc' });
    } else if (sort.key === 'company') {
      query = query.order('company', { ascending: sort.dir === 'asc' });
    } else if (sort.key === 'title') {
      query = query.order('title', { ascending: sort.dir === 'asc' });
    } else if (sort.key === 'location') {
      query = query.order('location', { ascending: sort.dir === 'asc' });
    }
    // Bemærk: 'comments' og 'saved' sortering håndteres på klienten
    // da disse data ikke er tilgængelige i den primære jobs tabel

    // 7. Paginering
    query = query.range(offset, offset + pageSize - 1);

    // Kør den færdige forespørgsel
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching jobs:', error.message || JSON.stringify(error));
      throw new Error(error.message || 'Supabase query failed');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      data: data || [],
      total,
      totalPages,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Fejl i getJobsFirstPageServer:', error);
    // Returner tomme data for at undgå at siden crasher
    return { data: [], total: 0, totalPages: 0, page, pageSize };
  }
} 