'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Filter, RotateCcw, Calendar, Check } from 'lucide-react'
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

  const regions = ['Hovedstaden', 'Sjælland', 'Fyn', 'Syd- og Sønderjylland', 'Midtjylland', 'Nordjylland', 'Udlandet']
  const toggleRegion = (region: string) => {
    const current = Array.isArray(filters.location) ? filters.location as string[] : (filters.location ? [filters.location as string] : [])
    const next = current.includes(region) ? current.filter(r => r !== region) : [...current, region]
    setFilters({ location: next.length ? next : undefined })
  }

  const scores = [3,2,1]
  const toggleScore = (score: number) => {
    const current = Array.isArray(filters.score) ? filters.score as number[] : (filters.score !== undefined ? [filters.score as number] : [])
    const next = current.includes(score) ? current.filter(s => s !== score) : [...current, score]
    setFilters({ score: next.length ? next : undefined })
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
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            {...animationVariants}
            style={{
              transform: isDragging ? `translateY(${dragDistance}px)` : undefined
            }}
            className="fixed bottom-0 left-0 right-0 z-[90] card-mobile rounded-t-3xl border-white/10 bg-white/6 shadow-[0_-16px_60px_rgba(0,0,0,0.55)] max-h-[85vh] overflow-hidden"
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
                                        className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors"
                  
                >
                  <X className="size-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-4 pb-[calc(16px+env(safe-area-inset-bottom))] overflow-y-auto max-h-[calc(85vh-140px)]">
              <div className="grid gap-4">
                {/* Regions multi-select */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 text-[12px] text-slate-400 font-semibold tracking-wide uppercase"><MapPin className="size-4" /> Regioner</div>
                  <div className="flex flex-wrap gap-2">
                    {regions.map((r) => {
                      const active = Array.isArray(filters.location) ? (filters.location as string[]).includes(r) : false
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRegion(r)}
                          className={`h-10 px-3 rounded-[12px] text-sm tracking-wide border transition-all duration-150 flex items-center ${active ? 'bg-blue-500/15 text-white border-blue-400/30 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]' : 'text-slate-300 border-white/10 hover:bg-white/8 hover:border-white/20'}`}
                        >
                          {active && <Check className="size-3 inline mr-1" />} {r}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Scores multi-select */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 text-[12px] text-slate-400 font-semibold tracking-wide uppercase"><Filter className="size-4" /> Scores</div>
                  <div className="flex flex-wrap gap-2">
                    {scores.map((s) => {
                      const active = Array.isArray(filters.score) ? (filters.score as number[]).includes(s) : filters.score === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleScore(s)}
                          className={`h-10 px-3 rounded-[12px] text-sm tracking-wide border transition-all duration-150 flex items-center ${active ? 'bg-green-500/15 text-white border-green-400/30 shadow-[0_0_0_1px_rgba(34,197,94,0.25)]' : 'text-slate-300 border-white/10 hover:bg-white/8 hover:border-white/20'}`}
                        >
                          {active && <Check className="size-3 inline mr-1" />} Score {s}
                        </button>
                      )
                    })}
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
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl transition-colors tap-target"
                >
                  <RotateCcw className="size-4" />
                  Nulstil
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-kpmg-500 hover:bg-kpmg-700 text-white font-medium rounded-xl transition-colors tap-target"
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