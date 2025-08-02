'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import FilterSheet from './FilterSheet'

export default function MobileFilterBar() {
  const { filters, resetFilters } = useJobStore()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isFabVisible, setIsFabVisible] = useState(true)
  const lastScrollY = useRef(0)
  const scrollTimeout = useRef<NodeJS.Timeout | undefined>(undefined)
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

  // Track scroll direction
  useEffect(() => {
    if (!isMobile) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = currentScrollY - lastScrollY.current
      
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }

      if (Math.abs(scrollDelta) > 8) {
        if (scrollDelta > 0) {
          // Scrolling down
          setIsFabVisible(false)
        } else {
          // Scrolling up
          setIsFabVisible(true)
        }
      }

      lastScrollY.current = currentScrollY

      // Auto-show FAB after scrolling stops
      scrollTimeout.current = setTimeout(() => {
        setIsFabVisible(true)
      }, 1000)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [isMobile])

  // Hide FAB when sheet is open
  useEffect(() => {
    if (isSheetOpen) {
      setIsFabVisible(false)
    } else {
      // Show FAB when sheet closes (after a short delay)
      setTimeout(() => setIsFabVisible(true), 300)
    }
  }, [isSheetOpen])

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
      const scoreLabels = { 3: 'Akut', 2: 'Høj', 1: 'Medium' }
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

  return (
    <>
      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2">
        {/* Active Filter Chips */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide"
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
        <div className="flex items-center justify-between">
          {/* Reset Button */}
          {activeFilters.length > 0 && (
            <button
              onClick={handleReset}
              className="text-[13px] text-slate-400 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Nulstil
            </button>
          )}
          
          {/* Spacer */}
          <div className="flex-1" />
        </div>
      </div>

      {/* FAB */}
      <AnimatePresence>
        {isFabVisible && !isSheetOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ 
              type: 'spring', 
              damping: 20, 
              stiffness: 300,
              mass: 0.8
            }}
            onClick={() => setIsSheetOpen(true)}
            className="fixed bottom-[calc(16px+env(safe-area-inset-bottom))] right-4 z-50 size-14 bg-kpmg-500 hover:bg-kpmg-700 text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 active:scale-95"
            aria-label="Åbn filtre"
            role="button"
          >
            <Filter className="size-6 mx-auto" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Filter Sheet */}
      <FilterSheet 
        open={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
      />
    </>
  )
} 