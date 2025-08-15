'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useJobStore } from '@/store/jobStore';

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
    isInitialized,
    applyFilters 
  } = useJobStore();
  const isInitialLoad = useRef(true);

  // 1. Initialiser fra URL ved første indlæsning
  useEffect(() => {
    if (isInitialLoad.current && !isInitialized) {
      const params = new URLSearchParams(searchParams.toString());
      
      const restoredFilters = {
        q: params.get('q') || undefined,
        score: params.get('score') ? params.get('score')!.split(',').map(Number) : undefined,
        location: params.get('location') ? params.get('location')!.split(',').filter(s => s.trim()) : undefined,
        dateFrom: params.get('from') || undefined,
        dateTo: params.get('to') || undefined,
      };
      
      const restoredPage = Number(params.get('page') || '1');
      const restoredPageSize = Number(params.get('pageSize') || '20');
      const restoredSort = {
        key: params.get('sort') || 'date',
        dir: (params.get('dir') as 'asc' | 'desc') || 'desc',
      };

      // Valider sort key
      const validKeys: Array<'score' | 'company' | 'title' | 'location' | 'date'> = ['score', 'company', 'title', 'location', 'date'];
      const validSortKey = validKeys.includes(restoredSort.key as any) ? restoredSort.key as any : 'date';
      
      // Valider page size
      const validPageSizes = [10, 20, 50, 100];
      const validPageSize = validPageSizes.includes(restoredPageSize) ? restoredPageSize : 20;

      console.log('useUrlFilterSync: Restoring filters from URL:', restoredFilters);
      
      setFilters(restoredFilters);
      setCurrentPage(restoredPage);
      setJobsPerPage(validPageSize);
      setSort({ key: validSortKey, dir: restoredSort.dir });
      
      // Anvend de gendannede filtre for at hente data
      console.log('useUrlFilterSync: Applying filters:', restoredFilters);
      applyFilters(restoredFilters);
      
      isInitialLoad.current = false;
    }
  }, [searchParams, isInitialized, setFilters, setCurrentPage, setJobsPerPage, setSort, applyFilters]);

  // 2. Opdater URL, når state ændrer sig
  useEffect(() => {
    if (isInitialLoad.current) return; // Vent på initialisering

    const params = new URLSearchParams();
    
    if (filters.q) params.set('q', filters.q);
    if (filters.score && Array.isArray(filters.score) && filters.score.length > 0) {
      params.set('score', filters.score.join(','));
    }
    if (filters.location && Array.isArray(filters.location) && filters.location.length > 0) {
      params.set('location', filters.location.join(','));
    }
    if (filters.dateFrom) params.set('from', filters.dateFrom);
    if (filters.dateTo) params.set('to', filters.dateTo);
    if (currentPage > 1) params.set('page', String(currentPage));
    if (jobsPerPage !== 20) params.set('pageSize', String(jobsPerPage));
    if (sort.key !== 'date' || sort.dir !== 'desc') {
      params.set('sort', sort.key);
      params.set('dir', sort.dir);
    }

    const queryString = params.toString();
    const newPath = queryString ? `${pathname}?${queryString}` : pathname;

    // Brug 'replace' for at undgå at tilføje til browserhistorikken
    router.replace(newPath, { scroll: false });

  }, [filters, currentPage, jobsPerPage, sort, pathname, router]);
} 