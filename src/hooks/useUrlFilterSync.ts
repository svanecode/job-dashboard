'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useJobStore } from '@/store/jobStore';

export function useUrlFilterSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { filters, setFilters, isInitialized, initializeFromURL, currentPage, setCurrentPage } = useJobStore();

  // Initial load: parse filters fra URL -> store
  useEffect(() => {
    if (!isInitialized) {
      initializeFromURL();
      return;
    }

    const scoreParam = searchParams.get('score');
    const locationParam = searchParams.get('location');
    const qParam = searchParams.get('q');
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');
    const pageParam = searchParams.get('page');

    // Convert URL params to filter structure
    const newFilters = {
      q: qParam || '',
      searchText: qParam || '', // Legacy compatibility
      score: scoreParam ? scoreParam.split(',').map(Number) : undefined,
      location: locationParam ? locationParam.split(',') : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };

    // Handle pagination
    if (pageParam) {
      const page = parseInt(pageParam);
      if (page !== currentPage && page >= 1) {
        setCurrentPage(page);
      }
    }

    // Only update if filters have actually changed
    const currentFiltersStr = JSON.stringify({
      q: filters.q,
      searchText: filters.searchText,
      score: filters.score,
      location: filters.location,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    });
    
    const newFiltersStr = JSON.stringify(newFilters);
    
    if (currentFiltersStr !== newFiltersStr) {
      setFilters(newFilters);
    }
  }, [searchParams, isInitialized, initializeFromURL, setFilters, filters, currentPage, setCurrentPage]);

  // Når filters ændres -> opdater URL
  useEffect(() => {
    if (!isInitialized) return; // Don't update URL during initialization
    
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.score) {
      const scoreArray = Array.isArray(filters.score) ? filters.score : [filters.score];
      if (scoreArray.length > 0) params.set('score', scoreArray.join(','));
    }
    if (filters.location) {
      const locationArray = Array.isArray(filters.location) ? filters.location : [filters.location];
      if (locationArray.length > 0) params.set('location', locationArray.join(','));
    }
    if (filters.dateFrom) params.set('from', filters.dateFrom);
    if (filters.dateTo) params.set('to', filters.dateTo);
    
    // Add pagination to URL (only if not page 1)
    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }

    const newUrl = `${pathname}?${params.toString()}`;
    const currentUrl = `${pathname}${window.location.search}`;
    
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, currentPage, router, pathname, isInitialized]);
} 