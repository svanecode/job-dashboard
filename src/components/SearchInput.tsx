'use client';

import { useJobStore } from '@/store/jobStore';
import { Search, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export default function SearchInput() {
  const { filters, setFilters, applyFilters, isLoading } = useJobStore();
  const [localQuery, setLocalQuery] = useState(filters.q || '');

  // Debounce søgningen - vent 500ms efter sidste tastetrykning
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== filters.q) {
        setFilters({ q: localQuery });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localQuery, filters.q, setFilters]);

  const handleSearch = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    applyFilters();
  }, [applyFilters]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setLocalQuery('');
    setFilters({ q: '' });
    applyFilters();
  }, [setFilters, applyFilters]);

  const handleSearchClick = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <div className="w-full">
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Søgefelt */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            placeholder="Søg i titel, firma, beskrivelse, lokation..."
            className="block w-full rounded-l-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-white placeholder-slate-400 focus:border-kpmg-500 focus:ring-kpmg-500 sm:text-sm transition-colors duration-200"
            disabled={isLoading}
          />
          {localQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white transition-colors duration-200"
              disabled={isLoading}
              title="Ryd søgning"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Søg og Ryd knapper */}
        <div className="flex mt-3 gap-2 justify-center">
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={isLoading}
            className="px-6 py-2 bg-kpmg-500 hover:bg-kpmg-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Søg
          </button>
          
          <button
            type="button"
            onClick={handleClearSearch}
            disabled={isLoading || !localQuery}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Ryd søgning"
          >
            <X className="h-4 w-4" />
            Ryd
          </button>
        </div>
      </div>
      
      <p className="text-xs text-slate-400 text-center mt-3">
        Søg i jobtitel, firmanavn, beskrivelse eller lokation
      </p>
    </div>
  );
} 