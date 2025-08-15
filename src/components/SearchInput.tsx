'use client';

import { useJobStore } from '@/store/jobStore';
import { Loader2, X } from 'lucide-react';
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setLocalQuery('');
    setFilters({ q: '' });
    applyFilters();
  }, [setFilters, applyFilters]);

  return (
    // Wrap i en sektion for at adskille den visuelt
    <div className="w-full text-center p-6 rounded-2xl bg-white/5 border border-white/10">
      <h2 className="text-lg font-medium text-white mb-1">Find relevante jobs</h2>
      <p className="text-slate-400 text-sm mb-4">
        Søg i jobtitel, firmanavn, beskrivelse eller lokation.
      </p>
      <div className="relative w-full max-w-xl mx-auto">
        {/* Søgefelt */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
            ) : (
              <div className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <input
            type="text"
            value={localQuery}
            onChange={handleInputChange}
            placeholder="Søg i titel, firma, beskrivelse, lokation..."
            className="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-white placeholder-slate-400 focus:border-kpmg-500 focus:ring-kpmg-500 sm:text-sm transition-colors duration-200"
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


      </div>
    </div>
  );
} 