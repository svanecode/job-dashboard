'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Building2, MapPin, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import ScoreBar from './ScoreBar'
import { formatDate, copyToClipboard, getDaysAgo } from '@/utils/format'
import { handleModalKeyDown, createFocusTrap } from '@/utils/keyboard'
import { useState, useEffect, useRef } from 'react'

export default function JobModal() {
  const { selectedJob, isModalOpen, closeJobModal, paginatedJobs, openJobModal } = useJobStore()
  const [isExpanded, setIsExpanded] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Focus management
  useEffect(() => {
    if (isModalOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      modalRef.current?.focus()
    } else {
      previousActiveElement.current?.focus()
    }
  }, [isModalOpen])

  // Reset expanded state when job changes
  useEffect(() => {
    setIsExpanded(false)
  }, [selectedJob?.id])

  // Keyboard handlers
  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      handleModalKeyDown(event, handleOpenJob, closeJobModal, handlePreviousJob, handleNextJob)
    }

    const handleFocusTrap = createFocusTrap(modalRef)

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleFocusTrap)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleFocusTrap)
    }
  }, [isModalOpen, selectedJob?.id])

  const handleOpenJob = () => {
    if (selectedJob?.job_url) {
      window.open(selectedJob.job_url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyLink = async () => {
    if (!selectedJob?.job_url) return
    
    const success = await copyToClipboard(selectedJob.job_url)
    if (success) {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1500)
    }
  }

  const handlePreviousJob = () => {
    if (!selectedJob || !paginatedJobs.length) return
    
    const currentIndex = paginatedJobs.findIndex(job => job.id === selectedJob.id)
    if (currentIndex > 0) {
      const previousJob = paginatedJobs[currentIndex - 1]
      openJobModal(previousJob)
    }
  }

  const handleNextJob = () => {
    if (!selectedJob || !paginatedJobs.length) return
    
    const currentIndex = paginatedJobs.findIndex(job => job.id === selectedJob.id)
    if (currentIndex < paginatedJobs.length - 1) {
      const nextJob = paginatedJobs[currentIndex + 1]
      openJobModal(nextJob)
    }
  }

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return ''
    const daysAgo = getDaysAgo(dateString)
    if (daysAgo === 0) return 'i dag'
    if (daysAgo === 1) return 'i går'
    return `for ${daysAgo} dage siden`
  }

  if (!selectedJob) return null

  const hasNavigation = paginatedJobs.length > 1
  const currentIndex = paginatedJobs.findIndex(job => job.id === selectedJob.id)
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < paginatedJobs.length - 1
  const shouldShowGradient = !isExpanded && selectedJob.description && selectedJob.description.length > 300

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeJobModal}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            className="fixed inset-4 z-50 flex items-center justify-center"
          >
            <div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="job-title"
              className="max-w-[720px] w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_10px_50px_-10px_rgba(0,0,0,0.6)] p-5 sm:p-6 text-slate-200 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <header className="space-y-2">
                    <h1 
                      id="job-title"
                      className="text-2xl font-semibold tracking-tight text-white [text-wrap:balance] max-w-[56ch] leading-tight"
                    >
                      {selectedJob.title || 'Ingen titel'}
                    </h1>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <ScoreBar score={selectedJob.cfo_score} />
                      <span className="tabular-nums">
                        {selectedJob.cfo_score !== null ? `${selectedJob.cfo_score}/3` : '—'}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="size-4 opacity-70" aria-hidden="true" />
                        <span className="break-words">
                          {selectedJob.company || 'Ukendt firma'}
                        </span>
                      </span>
                      <span aria-hidden="true">•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-4 opacity-70" aria-hidden="true" />
                        <span className="break-words">
                          {selectedJob.location || 'Ukendt lokation'}
                        </span>
                      </span>
                      <span aria-hidden="true">•</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Calendar className="size-4 opacity-70" aria-hidden="true" />
                        {formatDate(selectedJob.publication_date)}
                      </span>
                      <span className="text-slate-500">
                        ({getRelativeTime(selectedJob.publication_date)})
                      </span>
                    </div>
                  </header>
                </div>
                
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {/* Navigation arrows */}
                  {hasNavigation && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePreviousJob}
                        disabled={!canGoPrevious}
                        className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors focus-visible:ring-2 ring-white/20 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Forrige job"
                      >
                        <ChevronLeft className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={handleNextJob}
                        disabled={!canGoNext}
                        className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors focus-visible:ring-2 ring-white/20 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Næste job"
                      >
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                  
                  {/* Close button */}
                  <button
                    onClick={closeJobModal}
                    className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
                    aria-label="Luk modal"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Tags (if any) */}
              {selectedJob.job_info && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full px-2.5 py-1 text-xs bg-white/5 text-slate-300 ring-1 ring-white/10">
                    {selectedJob.job_info}
                  </span>
                </div>
              )}

              {/* Description */}
              <div className="mt-4">
                <div className="bg-white/5 rounded-lg p-4">
                  {selectedJob.description ? (
                    <div className="relative">
                      <p className={`text-slate-200 leading-relaxed break-words max-w-[70ch] ${
                        isExpanded ? '' : 'line-clamp-6'
                      }`}>
                        {selectedJob.description}
                      </p>
                      {shouldShowGradient && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent rounded-b-lg" />
                      )}
                      {selectedJob.description.length > 300 && (
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="mt-2 text-sm text-slate-300 hover:text-white underline-offset-2 hover:underline focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
                        >
                          {isExpanded ? 'Vis mindre' : 'Vis mere'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">
                      Ingen beskrivelse tilgængelig.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer actions - sticky for long content */}
              <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30 mt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  {selectedJob.job_url && (
                    <a
                      href={selectedJob.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-kpmg-700 hover:bg-kpmg-500 px-4 py-2 text-sm font-medium text-white transition focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      Åbn jobopslag
                    </a>
                  )}
                  <button
                    onClick={handleCopyLink}
                    className="ml-auto text-sm text-slate-400 hover:text-slate-200 underline-offset-2 hover:underline focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
                  >
                    {linkCopied ? 'Link kopieret!' : 'Kopiér link'}
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