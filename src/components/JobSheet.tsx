'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Copy, MapPin, Calendar, Building2 } from 'lucide-react'
import DescriptionClamp from './DescriptionClamp'
import ScoreBadge from './ScoreBadge'
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
  const [linkCopied, setLinkCopied] = useState(false)
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





  const copyToClipboard = async () => {
    if (jobUrl) {
      try {
        await navigator.clipboard.writeText(jobUrl)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 1500)
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
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border border-white/20 bg-white/5 backdrop-blur-sm shadow-[0_-16px_60px_rgba(0,0,0,0.55)] max-h-[90vh] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-12 rounded-full bg-white/20" />
            </div>

            {/* Content */}
            <div className="px-4 pb-4 overflow-y-auto max-h-[70vh]">
              {/* Header with title and score badge */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white [text-wrap:balance] flex-1 mr-4 leading-tight">
                    {title}
                  </h2>
                  <ScoreBadge score={score} size="md" />
                </div>

                {/* Company, location, date */}
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 opacity-70 flex-shrink-0" />
                    <span className="font-medium text-slate-300">
                      {company}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 opacity-70 flex-shrink-0" />
                    <span>{location}</span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <Calendar className="size-4 opacity-70 flex-shrink-0" />
                    <span>{formatDate(date)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <div className="text-sm text-slate-300 leading-relaxed">
                  <DescriptionClamp text={description} lines={12} className="text-slate-300" />
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mb-6">
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
            <div className="sticky bottom-0 px-4 pb-4 pt-3 bg-gradient-to-t from-white/5 to-transparent border-t border-white/10">
              <div className="space-y-3">
                {jobUrl && (
                  <button
                    onClick={() => window.open(jobUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#005EB8] hover:bg-[#0091DA] px-4 py-4 text-base font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
                  >
                    <ExternalLink className="size-5" />
                    Åbn jobopslag
                  </button>
                )}
                
                <div className="flex items-center gap-3">
                                      <button
                      onClick={copyToClipboard}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-200"
                    >
                    {linkCopied ? (
                      <>
                        <svg className="size-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Kopieret!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4" />
                        Kopiér link
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 px-4 py-3 text-sm text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <X className="size-4" />
                    Luk
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 