'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useJobStore } from '@/store/jobStore';
import { JobFilters } from '@/types/job';
import { SortConfig } from '@/utils/sort';

export function useUrlFilterSync() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { 
    filters, 
    setFilters, 
    currentPage, 
    setCurrentPage, 
    jobsPerPage, 
    setJobsPerPage, 
    sort, 
    setSort, 
    setInitialData // Brug den nye funktion til at sætte SSR data
  } = useJobStore();
  
  const isInitialLoad = useRef(true);

  // 1. Initialiser fra URL kun én gang
  useEffect(() => {
    if (isInitialLoad.current) {
      const params = new URLSearchParams(searchParams.toString());
      
      const restoredFilters: JobFilters = {
        q: params.get('q') || undefined,
        location: params.get('location') ? params.get('location')!.split(',') : undefined,
        // RETTELSE: Læs jobStatus fra URL
        jobStatus: params.get('jobStatus') as 'active' | 'expired' || 'active',
      };
      const restoredPage = Number(params.get('page') || '1');
      const restoredPageSize = Number(params.get('pageSize') || '20');
      const restoredSort: SortConfig = {
        key: (params.get('sort') as any) || 'date',
        dir: (params.get('dir') as 'asc' | 'desc') || 'desc',
      };

      // Sæt den initielle state uden at fetche data endnu
      const currentState = useJobStore.getState();
      
      // Tjek om state allerede er sat korrekt
      const needsUpdate = 
        JSON.stringify(currentState.filters) !== JSON.stringify(restoredFilters) ||
        currentState.currentPage !== restoredPage ||
        currentState.jobsPerPage !== restoredPageSize ||
        JSON.stringify(currentState.sort) !== JSON.stringify(restoredSort);
      
      if (needsUpdate) {
        useJobStore.setState({
            filters: restoredFilters,
            currentPage: restoredPage,
            jobsPerPage: restoredPageSize,
            sort: restoredSort,
            isInitialized: true // Marker som initialiseret
        });
      } else {
        useJobStore.setState({
            isInitialized: true // Marker som initialiseret
        });
      }
      
      isInitialLoad.current = false;
      
      // IKKE kald fetchJobs her - data kommer allerede fra SSR via JobTable
      // useJobStore.getState().fetchJobs();
    }
  }, [searchParams]);

  // 2. Opdater URL, når state ændrer sig
  useEffect(() => {
    if (isInitialLoad.current) return;

    const params = new URLSearchParams();
    
    if (filters.q) params.set('q', filters.q);
    if (filters.location && Array.isArray(filters.location) && filters.location.length > 0) {
      params.set('location', filters.location.join(','));
    }
    // RETTELSE: Skriv kun jobStatus til URL'en hvis den ikke er standard ('active')
    if (filters.jobStatus === 'expired') {
      params.set('jobStatus', 'expired');
    }
    if (currentPage > 1) params.set('page', String(currentPage));
    if (jobsPerPage !== 20) params.set('pageSize', String(jobsPerPage));
    if (sort.key !== 'date' || sort.dir !== 'desc') {
      params.set('sort', sort.key);
      params.set('dir', sort.dir);
    }

    const queryString = params.toString();
    const newPath = queryString ? `${pathname}?${queryString}` : pathname;
    
    // Brug 'replace' for at undgå unødvendige browserhistorik-entries
    router.replace(newPath, { scroll: false });

  }, [filters, currentPage, jobsPerPage, sort, pathname, router]);
} 