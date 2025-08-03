'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Copy, Check, Building2, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import ScoreBadge from './ScoreBadge'
import DescriptionClamp from './DescriptionClamp'
import { formatDate, copyToClipboard, getDaysAgo } from '@/utils/format'
import { handleModalKeyDown, createFocusTrap } from '@/utils/keyboard'
import { useState, useEffect, useRef } from 'react'

export default function JobModal() {
  const { selectedJob, isModalOpen, closeJobModal, paginatedJobs, openJobModal } = useJobStore()
  const [linkCopied, setLinkCopied] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
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

  // Focus management
  useEffect(() => {
    if (isModalOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      modalRef.current?.focus()
    } else {
      previousActiveElement.current?.focus()
    }
  }, [isModalOpen])

  // Scroll shadow effect for mobile
  useEffect(() => {
    if (!isMobile || !contentRef.current) return

    const handleScroll = () => {
      const scrollTop = contentRef.current?.scrollTop || 0
      setIsScrolled(scrollTop > 10)
    }

    const contentElement = contentRef.current
    contentElement.addEventListener('scroll', handleScroll)
    
    return () => contentElement.removeEventListener('scroll', handleScroll)
  }, [isMobile])

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
    const daysAgo = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    if (daysAgo === 0) return 'i dag'
    if (daysAgo === 1) return 'i går'
    return `for ${daysAgo} dage siden`
  }

  if (!selectedJob) return null

  const hasNavigation = paginatedJobs.length > 1
  const currentIndex = paginatedJobs.findIndex(job => job.id === selectedJob.id)
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < paginatedJobs.length - 1

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className={`fixed z-50 flex items-center justify-center ${
              isMobile 
                ? 'inset-0' 
                : 'inset-4'
            }`}
          >
            <div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="job-title"
              className={`relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md shadow-[0_10px_50px_-10px_rgba(0,0,0,0.6)] overflow-hidden ${
                isMobile 
                  ? 'w-full h-full rounded-none border-0' 
                  : 'max-w-[720px] w-full p-5 sm:p-6'
              }`}
            >
              {/* Radial gradient background */}
              <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent pointer-events-none" />

              {/* Mobile: Full screen layout */}
              {isMobile ? (
                <div className="flex flex-col h-full">
                  {/* Header with close button and score badge */}
                  <div className="relative p-4 border-b border-white/10 bg-black/40 backdrop-blur">
                    {/* Close button */}
                    <button
                      onClick={closeJobModal}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
                      aria-label="Luk"
                    >
                      <X className="size-5 text-slate-300" />
                    </button>

                    {/* Job title and company */}
                    <div className="pr-12">
                      <h1 
                        id="job-title"
                        className="text-xl font-semibold tracking-tight text-white leading-tight mb-3"
                      >
                        {selectedJob.title || 'Ingen titel'}
                      </h1>

                      {/* Company and score badge row */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-slate-400" />
                          <span className="text-slate-300 font-medium">
                            {selectedJob.company || 'Ukendt firma'}
                          </span>
                        </div>
                        
                        {/* Score badge prominently placed */}
                        {selectedJob.cfo_score && (
                          <ScoreBadge score={selectedJob.cfo_score} size="md" />
                        )}
                      </div>

                      {/* Location and date with better spacing */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-slate-400" />
                          <span className="text-slate-300">
                            {selectedJob.location || 'Ukendt lokation'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-slate-400" />
                          <span className="text-slate-300">
                            {formatDate(selectedJob.publication_date)}
                          </span>
                          <span className="text-slate-500 text-sm">
                            ({getRelativeTime(selectedJob.publication_date)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div 
                    ref={contentRef}
                    className="flex-1 overflow-y-auto p-4 max-h-[60vh]"
                  >
                    {/* Description */}
                    <DescriptionClamp 
                      text={selectedJob.description || undefined} 
                      lines={12} 
                      className="text-slate-200 leading-relaxed" 
                    />
                  </div>

                  {/* Footer with main action button */}
                  <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur">
                    {selectedJob.job_url && (
                      <button
                        onClick={handleOpenJob}
                        className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#005EB8] hover:bg-[#0091DA] px-6 py-4 text-base font-medium text-white transition-all duration-200 focus-visible:ring-2 ring-white/20 focus-visible:outline-none hover:shadow-lg hover:shadow-blue-500/25"
                      >
                        <ExternalLink className="size-5" aria-hidden="true" />
                        Åbn jobopslag
                      </button>
                    )}
                  </div>

                  {/* Scroll shadow */}
                  {isScrolled && (
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                  )}
                </div>
              ) : (
                /* Desktop: Original layout */
                <>
                  {/* Header */}
                  <div className="relative flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <header className="space-y-3">
                        <h1 
                          id="job-title"
                          className="text-2xl font-semibold tracking-tight [text-wrap:balance] max-w-[56ch] leading-tight"
                        >
                          <span className="text-white">
                            {selectedJob.title?.split(' - ')[0] || selectedJob.title || 'Ingen titel'}
                          </span>
                          {selectedJob.title?.includes(' - ') && (
                            <span className="block text-slate-200 mt-1">
                              {selectedJob.title.split(' - ').slice(1).join(' - ')}
                            </span>
                          )}
                        </h1>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {selectedJob.cfo_score && <ScoreBadge score={selectedJob.cfo_score} />}
                        </div>

                        {/* Enhanced meta-line with icons and better spacing */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="size-4 opacity-70" aria-hidden="true" />
                            <span className="break-words font-medium">
                              {selectedJob.company || 'Ukendt firma'}
                            </span>
                          </span>
                          <span aria-hidden="true" className="text-slate-500">•</span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4 opacity-70" aria-hidden="true" />
                            <span className="break-words">
                              {selectedJob.location || 'Ukendt lokation'}
                            </span>
                          </span>
                          <span aria-hidden="true" className="text-slate-500">•</span>
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <Calendar className="size-4 opacity-70" aria-hidden="true" />
                            {formatDate(selectedJob.publication_date)}
                          </span>
                          <span className="text-slate-500 text-xs ml-1">
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
                            className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 focus-visible:ring-2 ring-white/20 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
                            aria-label="Forrige job"
                          >
                            <ChevronLeft className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={handleNextJob}
                            disabled={!canGoNext}
                            className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 focus-visible:ring-2 ring-white/20 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
                            aria-label="Næste job"
                          >
                            <ChevronRight className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                      
                      {/* Close button */}
                      <button
                        onClick={closeJobModal}
                        className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 focus-visible:ring-2 ring-white/20 focus-visible:outline-none hover:shadow-lg hover:scale-105"
                        aria-label="Luk modal"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Description with fade effect */}
                  <DescriptionClamp 
                    text={selectedJob.description || undefined} 
                    lines={6} 
                    className="mt-4" 
                  />

                  {/* Footer actions - sticky for long content */}
                  <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/30 mt-6 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      {selectedJob.job_url && (
                        <a
                          href={selectedJob.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#005EB8] hover:bg-[#0091DA] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 focus-visible:ring-2 ring-white/20 focus-visible:outline-none hover:shadow-lg hover:shadow-blue-500/25"
                        >
                          <ExternalLink className="size-4" aria-hidden="true" />
                          Åbn jobopslag
                        </a>
                      )}
                      
                      {/* Copy link as icon button with tooltip */}
                      <button
                        onClick={handleCopyLink}
                        className="ml-auto size-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all duration-200 focus-visible:ring-2 ring-white/20 focus-visible:outline-none hover:shadow-lg hover:scale-105 group relative"
                        aria-label="Kopiér link"
                        title={linkCopied ? 'Link kopieret!' : 'Kopiér link'}
                      >
                        {linkCopied ? (
                          <Check className="size-4 text-green-400" aria-hidden="true" />
                        ) : (
                          <Copy className="size-4" aria-hidden="true" />
                        )}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-black/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                          {linkCopied ? 'Link kopieret!' : 'Kopiér link'}
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 