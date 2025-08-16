'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Filter, RotateCcw, Check } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
}

export default function FilterSheet({ open, onClose }: FilterSheetProps) {
  const { filters, stagedFilters, setFilters, setStagedFilters, resetFilters, applyFilters } = useJobStore()
  const [isDragging, setIsDragging] = useState(false)
  const [dragDistance, setDragDistance] = useState(0)
  const touchStartY = useRef<number>(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  // Initialize staged filters when component opens
  useEffect(() => {
    if (open) {
      setStagedFilters(filters)
    }
  }, [open, filters, setStagedFilters])

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
    const currentFilters = stagedFilters || filters
    const current = Array.isArray(currentFilters.location) ? currentFilters.location as string[] : (currentFilters.location ? [currentFilters.location as string] : [])
    const next = current.includes(region) ? current.filter(r => r !== region) : [...current, region]
    setStagedFilters({ ...currentFilters, location: next.length ? next : undefined })
  }

  const handleApply = () => {
    applyFilters()
    onClose()
  }

  const handleReset = () => {
    resetFilters()
    // Also reset staged filters to match
    setStagedFilters(filters)
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

          {/* Mobile bottom sheet variant */}
          {isMobile ? (
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
                        const currentFilters = stagedFilters || filters
                        const active = Array.isArray(currentFilters.location) ? (currentFilters.location as string[]).includes(r) : false
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
          ) : (
            // Desktop centered modal variant
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-2xl card rounded-2xl border border-white/10 bg-white/6 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Filtre</h2>
                    <button
                      onClick={onClose}
                      className="p-2 -m-2 rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Luk"
                    >
                      <X className="size-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">
                  <div className="grid gap-5">
                    {/* Regions multi-select */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2 text-[12px] text-slate-400 font-semibold tracking-wide uppercase"><MapPin className="size-4" /> Regioner</div>
                      <div className="flex flex-wrap gap-2">
                        {regions.map((r) => {
                          const currentFilters = stagedFilters || filters
                          const active = Array.isArray(currentFilters.location) ? (currentFilters.location as string[]).includes(r) : false
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
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/10 bg-white/2">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl transition-colors"
                    >
                      Nulstil
                    </button>
                    <button
                      onClick={handleApply}
                      className="px-4 py-2 bg-kpmg-500 hover:bg-kpmg-700 text-white font-medium rounded-xl transition-colors"
                    >
                      Anvend filtre
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
} 