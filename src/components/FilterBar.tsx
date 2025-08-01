'use client'

import { motion } from 'framer-motion'
import { Search, MapPin, Filter, RotateCcw, Calendar } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'

export default function FilterBar() {
  const { filters, setFilters, resetFilters } = useJobStore()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchText: e.target.value })
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, location: e.target.value })
  }

  const handleScoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const score = e.target.value === '' ? undefined : parseInt(e.target.value)
    setFilters({ ...filters, score })
  }

  const handleDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const days = e.target.value === '' ? undefined : parseInt(e.target.value)
    setFilters({ ...filters, daysAgo: days })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="sticky top-0 z-10 card p-4 mb-6 backdrop-blur-md bg-panel/80"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Søg i jobopslag..."
            value={filters.searchText || ''}
            onChange={handleSearchChange}
            className="glass-input pl-10 w-full"
          />
        </div>

        {/* Location */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Lokation..."
            value={filters.location || ''}
            onChange={handleLocationChange}
            className="glass-input pl-10 w-full"
          />
        </div>

        {/* Score Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <select
            value={filters.score?.toString() || ''}
            onChange={handleScoreChange}
            className="glass-input pl-10 w-full appearance-none cursor-pointer"
          >
            <option value="">Alle scores</option>
            <option value="3">Score 3 - Akut</option>
            <option value="2">Score 2 - Høj</option>
            <option value="1">Score 1 - Medium</option>
            <option value="0">Score 0 - Lav</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="size-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Date Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <select
            value={filters.daysAgo?.toString() || ''}
            onChange={handleDaysChange}
            className="glass-input pl-10 w-full appearance-none cursor-pointer"
          >
            <option value="">Alle datoer</option>
            <option value="1">Seneste 24 timer</option>
            <option value="7">Seneste 7 dage</option>
            <option value="30">Seneste 30 dage</option>
            <option value="90">Seneste 90 dage</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="size-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-slate-300 hover:border-white/20 hover:bg-white/5 transition-colors focus-ring"
        >
          <RotateCcw className="size-4" />
          Nulstil filtre
        </button>
      </div>
    </motion.div>
  )
} 