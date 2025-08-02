'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Copy, MapPin, Calendar, Building2 } from 'lucide-react'
import ScoreBars from './ScoreBars'
import DescriptionClamp from './DescriptionClamp'
import { formatDate } from '@/utils/format'

interface JobSheetProps {
  open: boolean
  onClose: () => void
  title: string
  company: string
  location: string
  date: string
  score: number
  description: string
  jobUrl?: string
  tags?: string[]
}

export default function JobSheet({
  open,
  onClose,
  title,
  company,
  location,
  date,
  score,
  description,
  jobUrl,
  tags = []
}: JobSheetProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragDistance, setDragDistance] = useState(0)
  const touchStartY = useRef<number>(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Handle swipe to close
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
    if (dragDistance > 60) {
      onClose()
    }
    setDragDistance(0)
  }

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  // Focus trap
  useEffect(() => {
    if (open && sheetRef.current) {
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
    }
  }, [open])

  const copyToClipboard = async () => {
    if (jobUrl) {
      try {
        await navigator.clipboard.writeText(jobUrl)
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy URL:', err)
      }
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              mass: 0.8
            }}
            style={{
              transform: isDragging ? `translateY(${dragDistance}px)` : undefined
            }}
            className="fixed bottom-0 left-0 right-0 z-50 card-mobile rounded-t-3xl border-white/10 bg-white/6 shadow-[0_-16px_60px_rgba(0,0,0,0.55)] max-h-[90vh] overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>

            {/* Content */}
            <div className="px-4 pb-4 overflow-y-auto max-h-[70vh]">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-base font-semibold text-white [text-wrap:balance] flex-1 mr-3">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 p-2 -m-2 rounded-full hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none tap-target"
                    aria-label="Luk"
                  >
                    <X className="size-5 text-slate-400" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3.5 opacity-80" />
                      {company}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 opacity-80" />
                      {location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 tabnums">
                      <Calendar className="size-3.5 opacity-80" />
                      {formatDate(date)}
                    </span>
                  </div>
                  <ScoreBars level={score as 1 | 2 | 3} size="sm" />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <div className="text-[15px] max-w-[70ch] break-words">
                  <DescriptionClamp text={description} lines={8} />
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-white/5 ring-1 ring-white/10 text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 px-4 pb-4 pt-2 bg-gradient-to-t from-white/6 to-transparent">
              <div className="flex gap-3">
                {jobUrl && (
                  <a
                    href={jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#005EB8] hover:bg-[#0091DA] text-white font-medium rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none tap-target"
                  >
                    <ExternalLink className="size-4" />
                    Åbn jobopslag
                  </a>
                )}
                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center p-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none tap-target"
                  aria-label="Kopiér link"
                >
                  <Copy className="size-4 text-slate-400" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 