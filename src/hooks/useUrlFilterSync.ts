'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useJobStore } from '@/store/jobStore';

export function useUrlFilterSync() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { filters, setFilters, currentPage, setCurrentPage } = useJobStore();

  // Init from URL on first render and whenever the search params actually change
  useEffect(() => {
    const score = sp.get('score');
    const location = sp.get('location');
    const q = sp.get('q') || '';
    const dateFrom = sp.get('from') || undefined;
    const dateTo = sp.get('to') || undefined;
    const page = Number(sp.get('page') || '1');

    setFilters({
      q,
      score: score ? score.split(',').map(Number) : [],
      location: location ? location.split(',') : [],
      dateFrom,
      dateTo,
    });
    setCurrentPage(isFinite(page) && page > 0 ? page : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  // Write to URL on changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.score?.length) params.set('score', filters.score.join(','));
    if (filters.location?.length) params.set('location', filters.location.join(','));
    if (filters.dateFrom) params.set('from', filters.dateFrom);
    if (filters.dateTo) params.set('to', filters.dateTo);
    if (currentPage > 1) params.set('page', String(currentPage));

    const next = `${pathname}?${params.toString()}`;
    // Avoid loops: only push if different
    if (next !== `${pathname}?${sp.toString()}`) {
      router.replace(next, { scroll: false });
    }
  }, [filters, currentPage, router, pathname]);
} 