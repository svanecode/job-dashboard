'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, ArrowUpDown } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import FilterSheet from './FilterSheet'

export default function MobileFilterBar() {
  const { filters, resetFilters, sort, setSort } = useJobStore()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 767px)').matches)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Early return if not mobile
  if (!isMobile) {
    return null
  }

  // Get active filter chips
  const getActiveFilters = () => {
    const active: string[] = []
    
    if (filters.searchText) {
      active.push(`"${filters.searchText}"`)
    }
    if (filters.location) {
      active.push(filters.location)
    }
    if (filters.score) {
      const scoreLabels = { 3: 'Akut', 2: 'Relevant', 1: 'Lav' }
      active.push(`Score ${filters.score} - ${scoreLabels[filters.score as keyof typeof scoreLabels]}`)
    }
    if (filters.daysAgo) {
      const dayLabels = { 1: '24t', 3: '3d', 7: '7d', 14: '14d', 30: '30d' }
      active.push(`Seneste ${dayLabels[filters.daysAgo as keyof typeof dayLabels]}`)
    }
    
    return active.slice(0, 3) // Max 3 chips
  }

  const activeFilters = getActiveFilters()

  const handleReset = () => {
    resetFilters()
  }

  const handleSortChange = (key: 'score' | 'company' | 'title' | 'location' | 'date', dir: 'asc' | 'desc') => {
    setSort({ key, dir })
    setIsSortSheetOpen(false)
  }

  const getSortLabel = () => {
    const sortLabels = {
      score: 'Score',
      company: 'Firma',
      title: 'Titel',
      location: 'Lokation',
      date: 'Dato'
    }
    const dirLabel = sort.dir === 'asc' ? 'A-Å' : 'Å-A'
    return `${sortLabels[sort.key]} (${dirLabel})`
  }

  return (
    <>
      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 pointer-events-none overflow-hidden w-full max-w-full">
        {/* Active Filter Chips */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide pointer-events-auto w-full max-w-full"
            >
              {activeFilters.map((filter, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex-shrink-0 rounded-full bg-white/8 ring-1 ring-white/10 text-xs px-2.5 py-1 text-slate-300"
                >
                  {filter}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Row */}
        <div className="flex items-center justify-between pointer-events-auto min-w-0 w-full max-w-full">
          {/* Reset Button */}
          {activeFilters.length > 0 && (
            <button
              onClick={handleReset}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 flex-shrink-0"
            >
              Nulstil
            </button>
          )}
          
          {/* Spacer */}
          <div className="flex-1" />
        </div>
      </div>

      {/* FAB - Always visible on mobile */}
      <div className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col gap-3 pointer-events-none w-auto max-w-full">
        {/* Sort Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 20, 
            stiffness: 300,
            mass: 0.8,
            delay: 0.1
          }}
          onClick={() => setIsSortSheetOpen(true)}
          className="size-12 bg-white/10 hover:bg-white/20 text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-95 backdrop-blur-sm border border-white/10 pointer-events-auto"
          aria-label="Sorter jobs"
          role="button"
        >
          <ArrowUpDown className="size-5 mx-auto" />
        </motion.button>

        {/* Filter Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            type: 'spring', 
            damping: 20, 
            stiffness: 300,
            mass: 0.8
          }}
          onClick={() => setIsSheetOpen(true)}
          className="size-14 bg-kpmg-500 hover:bg-kpmg-700 text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-95 pointer-events-auto"
          aria-label="Åbn filtre"
          role="button"
        >
          <Filter className="size-6 mx-auto" />
        </motion.button>
      </div>

      {/* Filter Sheet */}
      <FilterSheet 
        open={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
      />

      {/* Sort Sheet */}
      <AnimatePresence>
        {isSortSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsSortSheetOpen(false)}
            />

            {/* Sort Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ 
                type: 'spring', 
                damping: 25, 
                stiffness: 300,
                mass: 0.8
              }}
              className="fixed bottom-0 left-0 right-0 z-50 card-mobile rounded-t-3xl border-white/10 bg-white/6 shadow-[0_-16px_60px_rgba(0,0,0,0.55)] max-h-[60vh] overflow-hidden"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="h-1.5 w-10 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="px-4 pb-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Sorter</h2>
                  <button
                    onClick={() => setIsSortSheetOpen(false)}
                    className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
                    aria-label="Luk"
                  >
                    <svg className="size-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-4 py-4 overflow-y-auto max-h-[calc(60vh-140px)]">
                <div className="grid gap-2">
                  {/* Score */}
                  <button
                    onClick={() => handleSortChange('score', sort.key === 'score' && sort.dir === 'desc' ? 'asc' : 'desc')}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${
                      sort.key === 'score' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-white">Score</span>
                    {sort.key === 'score' && (
                      <span className="text-slate-300 text-sm">{sort.dir === 'desc' ? 'Akut-Relevant-Lav' : 'Lav-Relevant-Akut'}</span>
                    )}
                  </button>

                  {/* Company */}
                  <button
                    onClick={() => handleSortChange('company', sort.key === 'company' && sort.dir === 'desc' ? 'asc' : 'desc')}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${
                      sort.key === 'company' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-white">Firma</span>
                    {sort.key === 'company' && (
                      <span className="text-slate-300 text-sm">{sort.dir === 'desc' ? 'Å-A' : 'A-Å'}</span>
                    )}
                  </button>

                  {/* Title */}
                  <button
                    onClick={() => handleSortChange('title', sort.key === 'title' && sort.dir === 'desc' ? 'asc' : 'desc')}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${
                      sort.key === 'title' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-white">Titel</span>
                    {sort.key === 'title' && (
                      <span className="text-slate-300 text-sm">{sort.dir === 'desc' ? 'Å-A' : 'A-Å'}</span>
                    )}
                  </button>

                  {/* Location */}
                  <button
                    onClick={() => handleSortChange('location', sort.key === 'location' && sort.dir === 'desc' ? 'asc' : 'desc')}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${
                      sort.key === 'location' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-white">Lokation</span>
                    {sort.key === 'location' && (
                      <span className="text-slate-300 text-sm">{sort.dir === 'desc' ? 'Å-A' : 'A-Å'}</span>
                    )}
                  </button>

                  {/* Date */}
                  <button
                    onClick={() => handleSortChange('date', sort.key === 'date' && sort.dir === 'desc' ? 'asc' : 'desc')}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${
                      sort.key === 'date' ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-white">Dato</span>
                    {sort.key === 'date' && (
                      <span className="text-slate-300 text-sm">{sort.dir === 'desc' ? 'Nyeste først' : 'Ældste først'}</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
} 