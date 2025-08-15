'use client'

import { useEffect, useMemo } from 'react'
import { MapPin, Filter, Calendar, RotateCcw, ChevronDown, Check, X as CloseIcon } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import clsx from 'clsx'

export default function FilterBarDesktop() {
  const { filters, stagedFilters, setStagedFilters, applyFilters, resetFilters, rowDensity, setRowDensity } = useJobStore()
  
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
  const regions = ['Hovedstaden', 'Sjælland', 'Fyn', 'Syd- og Sønderjylland', 'Midtjylland', 'Nordjylland', 'Udlandet']
  const scores = [3, 2, 1]

  const toggleRegion = (region: string) => {
    const current = Array.isArray(stagedFilters?.location) ? stagedFilters!.location as string[] : (stagedFilters?.location ? [stagedFilters!.location as string] : [])
    const next = current.includes(region) ? current.filter(r => r !== region) : [...current, region]
    setStagedFilters?.({ ...stagedFilters, location: next.length ? next : undefined })
  }

  const toggleScore = (score: number) => {
    const current = Array.isArray(stagedFilters?.score) ? stagedFilters!.score as number[] : (stagedFilters?.score !== undefined ? [stagedFilters!.score as number] : [])
    const next = current.includes(score) ? current.filter(s => s !== score) : [...current, score]
    setStagedFilters?.({ ...stagedFilters, score: next.length ? next : undefined })
  }

  const dirtyCount = useMemo(() => {
    const loc = Array.isArray(stagedFilters?.location) ? stagedFilters!.location.length : (stagedFilters?.location ? 1 : 0)
    const sc  = Array.isArray(stagedFilters?.score) ? stagedFilters!.score.length : (stagedFilters?.score !== undefined ? 1 : 0)
    const dt  = stagedFilters?.daysAgo !== undefined ? 1 : 0
    return loc + sc + dt
  }, [stagedFilters])

  const removeRegion = (region: string) => {
    const current = Array.isArray(stagedFilters?.location) ? stagedFilters!.location as string[] : []
    const next = current.filter(r => r !== region)
    setStagedFilters?.({ ...stagedFilters, location: next.length ? next : undefined })
    // Don't apply immediately - let user apply with "Anvend filtre" button
  }

  const removeScore = (score: number) => {
    const current = Array.isArray(stagedFilters?.score) ? stagedFilters!.score as number[] : []
    const next = current.filter(s => s !== score)
    setStagedFilters?.({ ...stagedFilters, score: next.length ? next : undefined })
    // Don't apply immediately - let user apply with "Anvend filtre" button
  }

  return (
    <div className="hidden md:block sticky top-3 z-[70]">
      <div className="card p-4 md:p-5 flex flex-wrap gap-4 items-center">
        <form onSubmit={onSubmit} className="w-full">
          <div className="grid grid-cols-[auto,1.6fr,auto,1.2fr,auto,auto,auto] gap-4 items-center">
            {/* Nulstil (left) */}
            <button
              type="button"
              onClick={onReset}
              className="text-sm text-neutral-500 hover:text-white underline transition"
              title="Nulstil filtre"
            >
              Nulstil
            </button>
            
            {/* Regions (multi-select chips) */}
            <div className="min-w-0">
              <div className="uppercase text-[11px] tracking-wider font-medium text-neutral-500 mb-2">
                REGIONER
              </div>
              <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide">
                {regions.map((r) => {
                  const active = Array.isArray(stagedFilters?.location) ? stagedFilters!.location!.includes(r) : false
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRegion(r)}
                      className={clsx(
                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                        'h-9 flex items-center justify-center',
                        active 
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' 
                          : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white'
                      )}
                      title={r}
                    >
                      {active && <Check className="size-3 mr-1" />}
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-10 bg-white/10 self-center rounded-full" />

            {/* Scores (multi-select chips) */}
            <div className="min-w-0">
              <div className="uppercase text-[11px] tracking-wider font-medium text-neutral-500 mb-2">
                SCORES
              </div>
              <div className="flex flex-wrap gap-2">
                {scores.map((s) => {
                  const active = Array.isArray(stagedFilters?.score) ? stagedFilters!.score!.includes(s) : stagedFilters?.score === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleScore(s)}
                      className={clsx(
                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                        'h-9 flex items-center justify-center',
                        active 
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' 
                          : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white'
                      )}
                      title={`Score ${s}`}
                    >
                      {active && <Check className="size-3 mr-1" />}
                      Score {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dato */}
            <div className="relative min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <select
                aria-label="Dato"
                className="h-9 pl-10 pr-9 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                value={stagedFilters?.daysAgo ?? ''}
                onChange={(e) => {
                  const next = { ...stagedFilters!, daysAgo: e.target.value ? Number(e.target.value) : undefined }
                  setStagedFilters?.(next)
                  // Don't apply immediately - let user apply with "Anvend filtre" button
                }}
              >
                <option value="">Alle datoer</option>
                <option value="1">Seneste 24 timer</option>
                <option value="3">Seneste 3 dage</option>
                <option value="7">Seneste 7 dage</option>
                <option value="14">Seneste 14 dage</option>
                <option value="30">Seneste 30 dage</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none size-4 text-neutral-400" />
            </div>

            {/* Density toggle */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setRowDensity?.('comfortable')}
                  className={clsx(
                    'px-3 py-1 text-sm transition rounded-md',
                    rowDensity === 'comfortable' 
                      ? 'bg-kpmg-500 text-white' 
                      : 'text-neutral-300 hover:bg-white/10'
                  )}
                  title="Komfortabel visning"
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setRowDensity?.('compact')}
                  className={clsx(
                    'px-3 py-1 text-sm transition rounded-md',
                    rowDensity === 'compact' 
                      ? 'bg-kpmg-500 text-white' 
                      : 'text-neutral-300 hover:bg-white/10'
                  )}
                  title="Kompakt visning"
                >
                  Kompakt
                </button>
              </div>
            </div>

            {/* Anvend sticky on right */}
            <div className="flex items-center flex-shrink-0 ml-auto">
              <button
                type="submit"
                disabled={!dirtyCount}
                className={clsx(
                  'h-9 px-4 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-kpmg-500/50 transition',
                  dirtyCount 
                    ? 'bg-kpmg-500 hover:bg-kpmg-700 text-white' 
                    : 'bg-white/5 text-neutral-400 cursor-not-allowed'
                )}
                aria-disabled={!dirtyCount}
              >
                Anvend filtre{dirtyCount ? ` (${dirtyCount})` : ''}
              </button>
            </div>
          </div>
        </form>

        {/* Active badges row under bar */}
        {dirtyCount > 0 ? (
          <div className="px-5 pb-3 pt-1 flex flex-wrap gap-2 text-xs">
            {Array.isArray(stagedFilters?.location) && stagedFilters!.location!.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/8 text-white/80 ring-1 ring-white/10">
                {r}
                <button onClick={() => removeRegion(r)} className="p-0.5 hover:text-white/100 focusable" aria-label={`Fjern ${r}`}>
                  <CloseIcon className="size-3" />
                </button>
              </span>
            ))}
            {Array.isArray(stagedFilters?.score) && stagedFilters!.score!.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/8 text-white/80 ring-1 ring-white/10">
                Score {s}
                <button onClick={() => removeScore(s)} className="p-0.5 hover:text-white/100 focusable" aria-label={`Fjern score ${s}`}>
                  <CloseIcon className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="px-5 pb-3 pt-1 text-[11px] uppercase tracking-wide text-neutral-500">Ingen filtre aktive</div>
        )}
      </div>
    </div>
  )
}