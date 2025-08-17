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
      console.log('🔍 jobsServer - Filtrerer for UDLØBETE jobs');
      // RETTELSE: Korrekt syntaks er .not('kolonne', 'is', null)
      query = query.not('deleted_at', 'is', null); 
    } else {
      // For "Aktuelle" jobs (standard), find dem hvor 'deleted_at' ER null.
      console.log('🔍 jobsServer - Filtrerer for AKTUELLE jobs');
      query = query.is('deleted_at', null);
    }

    // Tilføj altid cfo_score filteret efter status
    query = query.gte('cfo_score', 1);
    
    // 2. Søgefilter (hvis det findes)
    if (filters.q?.trim()) {
      const term = filters.q.trim();
      console.log('🔍 jobsServer - Tilføjer søgefilter for:', term);
      // Bruger .or() til at søge i flere kolonner inklusive location og description
      query = query.or(`title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
    }
    
    // 3. Lokationsfilter (hvis det findes)
    if (filters.location?.length) {
      console.log('🔍 jobsServer - Tilføjer lokationsfilter for:', filters.location);
      query = query.overlaps('region', filters.location);
    }

    // 4. Datofilter (hvis det findes)
    if (filters.dateFrom) {
      console.log('🔍 jobsServer - Tilføjer dateFrom filter:', filters.dateFrom);
      query = query.gte('publication_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      console.log('🔍 jobsServer - Tilføjer dateTo filter:', filters.dateTo);
      query = query.lte('publication_date', filters.dateTo);
    }
    if (filters.daysAgo) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.daysAgo);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
      console.log('🔍 jobsServer - Tilføjer daysAgo filter:', filters.daysAgo, 'cutoff:', cutoffDateStr);
      query = query.gte('publication_date', cutoffDateStr);
    }

    // 5. Score filter (hvis det findes)
    if (filters.score?.length) {
      console.log('🔍 jobsServer - Tilføjer score filter:', filters.score);
      query = query.in('cfo_score', filters.score);
    }

    // 6. Sortering
    console.log('🔍 jobsServer - Anvender sortering:', sort.key, sort.dir);
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

    console.log('🔍 jobsServer - Final query filters:', {
      jobStatus: filters.jobStatus,
      q: filters.q,
      location: filters.location,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      daysAgo: filters.daysAgo,
      score: filters.score,
      page,
      pageSize
    });

    // Kør den færdige forespørgsel
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching jobs:', error.message || JSON.stringify(error));
      throw new Error(error.message || 'Supabase query failed');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    console.log('🔍 jobsServer - Query successful:', {
      total,
      returned: data?.length || 0,
      totalPages,
      page,
      pageSize
    });

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