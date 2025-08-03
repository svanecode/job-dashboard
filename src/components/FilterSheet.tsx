'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, MapPin, Filter, RotateCcw, Calendar } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
}

export default function FilterSheet({ open, onClose }: FilterSheetProps) {
  const { filters, setFilters, resetFilters, applyFilters } = useJobStore()
  const [isDragging, setIsDragging] = useState(false)
  const [dragDistance, setDragDistance] = useState(0)
  const touchStartY = useRef<number>(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useRef(false)
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

  // Check for reduced motion preference
  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Handle keyboard
  useEffect(() => {
    if (!isMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      // Hide FAB
      document.documentElement.style.setProperty('--fab-visible', '0')
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
      // Show FAB
      document.documentElement.style.setProperty('--fab-visible', '1')
    }
  }, [open, onClose, isMobile])

  // Focus trap
  useEffect(() => {
    if (!isMobile || !open || !sheetRef.current) return

    const focusableElements = sheetRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => document.removeEventListener('keydown', handleTabKey)
  }, [open, isMobile])

  // Early return if not mobile
  if (!isMobile) {
    return null
  }

  // Handle swipe to close with snap points
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - touchStartY.current)
    setDragDistance(distance)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    const threshold = 60
    const snap35 = window.innerHeight * 0.35
    const snap85 = window.innerHeight * 0.85
    
    if (dragDistance > threshold) {
      if (dragDistance < snap35) {
        // Snap to 35%
        setDragDistance(snap35)
        setTimeout(() => setDragDistance(0), 100)
      } else if (dragDistance < snap85) {
        // Snap to 85%
        setDragDistance(snap85)
        setTimeout(() => setDragDistance(0), 100)
      } else {
        // Close sheet
        onClose()
      }
    }
    setDragDistance(0)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ searchText: e.target.value })
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ location: e.target.value })
  }

  const handleScoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const score = e.target.value === '' ? undefined : parseInt(e.target.value)
    setFilters({ score })
  }

  const handleDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const days = e.target.value === '' ? undefined : parseInt(e.target.value)
    setFilters({ daysAgo: days })
  }

  const handleApply = () => {
    applyFilters()
    onClose()
  }

  const handleReset = () => {
    resetFilters()
  }

  // Animation variants based on motion preference
  const animationVariants = prefersReducedMotion.current ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.2 }
  } : {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { 
      type: 'spring' as const, 
      damping: 25, 
      stiffness: 300,
      mass: 0.8
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            {...animationVariants}
            style={{
              transform: isDragging ? `translateY(${dragDistance}px)` : undefined
            }}
            className="fixed bottom-0 left-0 right-0 z-50 card-mobile rounded-t-3xl border-white/10 bg-white/6 shadow-[0_-16px_60px_rgba(0,0,0,0.55)] max-h-[85vh] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-4 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Filtre</h2>
                <button
                  onClick={onClose}
                  className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
                  aria-label="Luk"
                >
                  <X className="size-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-4 overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="grid gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Søg i jobopslag..."
                    value={filters.searchText || ''}
                    onChange={handleSearchChange}
                    className="glass-input pl-10 w-full tap-target"
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
                    className="glass-input pl-10 w-full tap-target"
                  />
                </div>

                {/* Score Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <select
                    value={filters.score?.toString() || ''}
                    onChange={handleScoreChange}
                    className="glass-input pl-10 w-full appearance-none cursor-pointer tap-target"
                  >
                    <option value="">Alle scores</option>
                    <option value="3">Score 3 - Akut</option>
                    <option value="2">Score 2 - Relevant</option>
                    <option value="1">Score 1 - Lav</option>
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
                    className="glass-input pl-10 w-full appearance-none cursor-pointer tap-target"
                  >
                    <option value="">Alle datoer</option>
                    <option value="1">Seneste 24 timer</option>
                    <option value="3">Seneste 3 dage</option>
                    <option value="7">Seneste 7 dage</option>
                    <option value="14">Seneste 14 dage</option>
                    <option value="30">Seneste 30 dage</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="size-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-white/6 to-transparent">
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none tap-target"
                >
                  <RotateCcw className="size-4" />
                  Nulstil
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-kpmg-500 hover:bg-kpmg-700 text-white font-medium rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none tap-target"
                >
                  Anvend filtre
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 