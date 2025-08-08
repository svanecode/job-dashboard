'use client'

import { useEffect, useMemo } from 'react'
import { Search, MapPin, Filter, Calendar, RotateCcw, ChevronDown } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import clsx from 'clsx'

const base = "h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-9 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/20 hover:border-white/20 transition"
const selectBase = "appearance-none cursor-pointer"
const icon = "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400"
const chevron = "absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"

export default function FilterBarDesktop() {
  const { filters, stagedFilters, setStagedFilters, applyFilters, resetFilters } = useJobStore()
  
  // Check if there are any staged changes (dirty state)
  const dirty = useMemo(() => {
    if (!stagedFilters) return false
    return JSON.stringify(stagedFilters) !== JSON.stringify(filters)
  }, [filters, stagedFilters])

  // Sync staged filters with actual filters on mount and when filters change externally
  useEffect(() => {
    setStagedFilters(filters)
  }, [filters, setStagedFilters])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (dirty && stagedFilters) {
      applyFilters(stagedFilters)
    }
  }

  const onReset = () => {
    resetFilters()
  }

  // Helper functions to handle array values
  const getSearchValue = () => {
    return stagedFilters?.q || stagedFilters?.searchText || ''
  }

  const getLocationValue = () => {
    if (!stagedFilters?.location) return ''
    const location = Array.isArray(stagedFilters.location) ? stagedFilters.location[0] : stagedFilters.location
    return location || ''
  }

  const getScoreValue = () => {
    if (!stagedFilters?.score) return ''
    const score = Array.isArray(stagedFilters.score) ? stagedFilters.score[0] : stagedFilters.score
    return score ? score.toString() : ''
  }

  const updateSearch = (value: string) => {
    setStagedFilters?.({ 
      ...stagedFilters, 
      q: value,
      searchText: value // Legacy compatibility
    })
  }

  const updateLocation = (value: string) => {
    setStagedFilters?.({ 
      ...stagedFilters, 
      location: value ? [value] : undefined
    })
  }

  const updateScore = (value: string) => {
    setStagedFilters?.({ 
      ...stagedFilters, 
      score: value ? [Number(value)] : undefined
    })
  }

  return (
    <div className="hidden md:block sticky top-3 z-40 overflow-hidden">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] px-3.5 py-2.5 overflow-hidden">
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-[2fr,1.3fr,1fr,1fr,auto,auto] gap-2.5 min-w-0">
            {/* Søg */}
            <div className="relative min-w-0">
              <Search className={icon} />
              <input
                aria-label="Søg i jobopslag"
                className={base}
                placeholder="Søg i jobopslag…"
                value={getSearchValue()}
                onChange={(e) => updateSearch(e.target.value)}
              />
            </div>

            {/* Lokation */}
            <div className="relative min-w-0">
              <MapPin className={icon} />
              <input
                aria-label="Lokation"
                className={base}
                placeholder="Lokation…"
                value={getLocationValue()}
                onChange={(e) => updateLocation(e.target.value)}
              />
            </div>

            {/* Score */}
            <div className="relative min-w-0">
              <Filter className={icon} />
              <select
                aria-label="Score"
                className={clsx(base, selectBase, "pl-10")}
                value={getScoreValue()}
                onChange={(e) => updateScore(e.target.value)}
              >
                <option value="">Alle scores</option>
                <option value="3">Score 3 – Akut</option>
                <option value="2">Score 2 – Relevant</option>
                <option value="1">Score 1 – Lav</option>
              </select>
              <ChevronDown className={chevron} />
            </div>

            {/* Dato */}
            <div className="relative min-w-0">
              <Calendar className={icon} />
              <select
                aria-label="Dato"
                className={clsx(base, selectBase, "pl-10")}
                value={stagedFilters?.daysAgo ?? ''}
                onChange={(e) => setStagedFilters?.({ 
                  ...stagedFilters, 
                  daysAgo: e.target.value ? Number(e.target.value) : undefined 
                })}
              >
                <option value="">Alle datoer</option>
                <option value="1">Seneste 24 timer</option>
                <option value="3">Seneste 3 dage</option>
                <option value="7">Seneste 7 dage</option>
                <option value="14">Seneste 14 dage</option>
                <option value="30">Seneste 30 dage</option>
              </select>
              <ChevronDown className={chevron} />
            </div>

            {/* Nulstil */}
            <div className="flex items-center flex-shrink-0">
              <button
                type="button"
                onClick={onReset}
                className="h-10 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 text-sm text-slate-300 hover:border-white/20 hover:bg-white/5 focus:ring-2 focus:ring-white/20 focus:outline-none transition"
              >
                <RotateCcw className="size-4" />
                Nulstil
              </button>
            </div>

            {/* Anvend */}
            <div className="flex items-center flex-shrink-0">
              <button
                type="submit"
                disabled={!dirty}
                className={clsx(
                  "h-10 inline-flex items-center gap-2 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 transition",
                  dirty 
                    ? "bg-kpmg-700 hover:bg-kpmg-500 text-white" 
                    : "bg-white/5 text-slate-400 cursor-not-allowed"
                )}
                aria-disabled={!dirty}
              >
                Anvend filtre
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}