'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Copy, Check, Building2, MapPin, Calendar, ChevronLeft, ChevronRight, Bookmark, MessageSquare, Send, Trash2 } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import { useAuth } from '@/contexts/AuthContext'
import ScoreBadge from './ScoreBadge'
import DescriptionClamp from './DescriptionClamp'
import { formatDate, copyToClipboard, getDaysAgo } from '@/utils/format'
import { savedJobsService } from '@/services/savedJobsService'
import { useState, useEffect, useRef } from 'react'

export default function JobModal() {
  const { selectedJob, isModalOpen, closeJobModal, paginatedJobs, openJobModal } = useJobStore()
  const { user } = useAuth()
  const [linkCopied, setLinkCopied] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Comment state
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [showComments, setShowComments] = useState(true) // Always show comments

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 767px)').matches)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Focus management + body scroll lock + ESC close
  useEffect(() => {
    if (!isModalOpen) return
    previousActiveElement.current = document.activeElement as HTMLElement
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modalRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeJobModal()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      previousActiveElement.current?.focus()
    }
  }, [isModalOpen, closeJobModal])

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

  const handleSaveJob = async () => {
    if (!selectedJob) return
    
    console.log('JobModal: User state:', { user: user?.id, email: user?.email });
    console.log('JobModal: Selected job:', selectedJob.job_id);
    
    if (!user) {
      console.error('User not authenticated')
      alert('Du skal være logget ind for at gemme jobs')
      return
    }
    
    try {
      setIsSaving(true)
      
      if (isSaved) {
        // Job is already saved, so we need to unsave it
        console.log('JobModal: Attempting to unsave job:', selectedJob.job_id);
        // First get the saved job ID
        const savedJobs = await savedJobsService.getSavedJobs()
        console.log('JobModal: Retrieved saved jobs:', savedJobs);
        
        const savedJob = savedJobs.find(job => job.job_id === selectedJob.job_id)
        console.log('JobModal: Found saved job:', savedJob);
        
        if (savedJob && savedJob.saved_job_id) {
          console.log('JobModal: Deleting saved job with ID:', savedJob.saved_job_id);
          await savedJobsService.deleteSavedJob(savedJob.saved_job_id)
          setIsSaved(false)
        } else {
          console.error('JobModal: Could not find saved job to delete or missing saved_job_id');
          console.error('JobModal: savedJob object:', savedJob);
          alert('Kunne ikke finde det gemte job')
        }
      } else {
        // Job is not saved, so save it
        console.log('JobModal: Attempting to save job:', selectedJob.job_id);
        const result = await savedJobsService.saveJob({ job_id: selectedJob.job_id })
        console.log('JobModal: Save result:', result)
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error saving/unsaving job:', error)
      // Show error to user
      alert(`Kunne ikke ${isSaved ? 'fjerne' : 'gemme'} job: ${error instanceof Error ? error.message : 'Ukendt fejl'}`)
    } finally {
      setIsSaving(false)
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

  // Load comments for the current job
  const loadComments = async () => {
    if (!selectedJob?.job_id) return
    
    try {
      setIsLoadingComments(true)
      const commentsData = await savedJobsService.getJobComments(selectedJob.job_id)
      setComments(commentsData)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Add a new comment
  const handleAddComment = async () => {
    if (!selectedJob?.job_id || !newComment.trim() || !user) return
    
    try {
      setIsAddingComment(true)
      await savedJobsService.addComment(selectedJob.job_id, newComment.trim())
      setNewComment('')
      // Reload comments to show the new one
      await loadComments()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Kunne ikke tilføje kommentar')
    } finally {
      setIsAddingComment(false)
    }
  }

  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedJob?.job_id || !user) return
    try {
      await savedJobsService.deleteComment(commentId)
      // Reload comments to update the list
      await loadComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Kunne ikke slette kommentar')
    }
  }

  // Load comments when job changes
  useEffect(() => {
    if (selectedJob?.job_id) {
      loadComments()
      // Check if job is already saved
      checkIfJobSaved()
    }
  }, [selectedJob?.job_id])

  // Check if the current job is already saved
  const checkIfJobSaved = async () => {
    if (!selectedJob?.job_id || !user) {
      setIsSaved(false)
      return
    }
    
    try {
      const saved = await savedJobsService.isJobSaved(selectedJob.job_id)
      setIsSaved(saved)
    } catch (error) {
      console.error('Error checking if job is saved:', error)
      setIsSaved(false)
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] cursor-pointer"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            role="dialog" aria-modal="true" aria-labelledby="job-title"
            className={`fixed z-[90] flex items-center justify-center pointer-events-none ${
              isMobile 
                ? 'inset-0' 
                : 'inset-4'
            }`}
          >
            <div
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
              className={`relative rounded-2xl ring-1 ring-white/10 bg-neutral-900/95 backdrop-blur-md shadow-2xl overflow-hidden pointer-events-auto ${
                isMobile 
                  ? 'w-full h-full rounded-none border-0' 
                  : 'max-w-[800px] w-full p-6'
              }`}
            >
                  {/* Floating top-right controls */}
                  {!isMobile && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                      {hasNavigation && (
                        <>
                          <button
                            onClick={handlePreviousJob}
                            disabled={!canGoPrevious}
                            className="size-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Forrige"
                          >
                            <ChevronLeft className="size-4" />
                          </button>
                          <button
                            onClick={handleNextJob}
                            disabled={!canGoNext}
                            className="size-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Næste"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={closeJobModal}
                        className="size-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                        aria-label="Luk"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
              {/* Radial gradient background */}
              <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent pointer-events-none" />

              {/* Mobile: Full screen layout */}
              {isMobile ? (
                <div className="flex flex-col h-full">
                  {/* Sticky header */}
                  <div className="sticky top-0 z-10 p-4 border-b border-white/10 bg-neutral-900/95 backdrop-blur">
                    {/* Close button */}
                    <button
                      onClick={closeJobModal}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
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
                            {formatDate((selectedJob.created_at || selectedJob.publication_date) as string)}
                          </span>
                          <span className="text-slate-500 text-sm">
                            ({getRelativeTime((selectedJob.created_at || selectedJob.publication_date) as string)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div 
                    ref={contentRef}
                    className="flex-1 overflow-y-auto p-4 max-h-[60vh] pb-[calc(16px+env(safe-area-inset-bottom))]"
                  >
                    {/* Description */}
                    <DescriptionClamp 
                      text={selectedJob.description || undefined} 
                      lines={12} 
                      className="text-slate-200 leading-relaxed" 
                    />
                  </div>

                  {/* Sticky footer actions */}
                  <div className="sticky bottom-0 p-4 border-t border-white/10 bg-neutral-900/90 backdrop-blur space-y-3">
                    {selectedJob.job_url && (
                      <button
                        onClick={handleOpenJob}
                        className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#005EB8] hover:bg-[#0091DA] px-6 py-4 text-base font-medium text-white transition-all duration-200 focus-visible:ring-2 ring-white/20 focus-visible:outline-none hover:shadow-lg hover:shadow-blue-500/25"
                      >
                        <ExternalLink className="size-5" aria-hidden="true" />
                        Åbn jobopslag
                      </button>
                    )}
                    
                    {/* Save job button - only show if user is authenticated */}
                    {user && (
                      <button
                        onClick={handleSaveJob}
                        disabled={isSaving}
                        className={`w-full flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-base font-medium transition-all duration-200 ${
                          isSaved 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/20'
                        }`}
                      >
                        {isSaving ? (
                          <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isSaved ? (
                          <Trash2 className="size-5" />
                        ) : (
                          <Bookmark className="size-5" />
                        )}
                        {isSaved ? 'Fjern fra gemte' : 'Gem job'}
                      </button>
                    )}
                  </div>

                  {/* Scroll shadow */}
                  {isScrolled && (
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
                  )}
                </div>
              ) : (
                /* Desktop: Enhanced layout with consistent padding */
                <>
                  {/* Header */}
                  <div className="relative mb-6">
                    <div className="flex-1 min-w-0">
                      <header className="space-y-3 pr-20 md:pr-24">
                        <h1 
                          id="job-title"
                          className="text-xl font-semibold text-white"
                        >
                          {selectedJob.title?.split(' - ')[0] || selectedJob.title || 'Ingen titel'}
                        </h1>

                        {selectedJob.title?.includes(' - ') && (
                          <span className="block text-neutral-300 mt-1 text-sm">
                            {selectedJob.title.split(' - ').slice(1).join(' - ')}
                          </span>
                        )}

                        {selectedJob.cfo_score === 3 && (
                          <span className="inline-flex items-center rounded-full bg-blue-500/15 text-blue-300 text-xs font-medium px-3 py-0.5 mt-3">
                            Akut
                          </span>
                        )}

                        {/* Enhanced meta-line with icons and better spacing */}
                        <div className="flex items-center gap-4 mt-4 text-sm text-neutral-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="size-4 opacity-70" aria-hidden="true" />
                            <span className="break-words font-medium">
                              {selectedJob.company || 'Ukendt firma'}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4 opacity-70" aria-hidden="true" />
                            <span className="break-words">
                              {selectedJob.location || 'Ukendt lokation'}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <Calendar className="size-4 opacity-70" aria-hidden="true" />
                            {formatDate((selectedJob.created_at || selectedJob.publication_date) as string)}
                          </span>
                        </div>
                      </header>
                    </div>
                    {/* Controls are rendered as floating buttons top-right */}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10 my-6" />

                  {/* Description with fade effect */}
                  <div className="mb-8">
                    {selectedJob.description ? (
                      <div className="prose prose-invert max-w-none text-neutral-200 leading-relaxed text-[15px]">
                        {selectedJob.description}
                      </div>
                    ) : (
                      <p className="italic text-neutral-500">Ingen beskrivelse tilgængelig</p>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-neutral-400 mb-3">Kommentarer</h3>
                    
                    {/* Comments list */}
                    <div className="space-y-3 mb-4">
                      {isLoadingComments ? (
                        <div className="text-center py-4">
                          <div className="size-6 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-neutral-400">Indlæser kommentarer...</p>
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-sm text-neutral-500 italic mb-4">
                          Ingen kommentarer endnu. Vær den første til at kommentere!
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">
                                  {comment.user_name || 'Anonymous'}
                                </span>
                                <span className="text-xs text-neutral-400">
                                  {getRelativeTime(comment.created_at)}
                                </span>
                              </div>
                              {/* Show delete button only for user's own comments */}
                              {user && comment.user_id === user.id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                                  title="Slet kommentar"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-neutral-300">{comment.comment}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add comment form */}
                    {user && (
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Skriv en kommentar..."
                          className="h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={isAddingComment || !newComment.trim()}
                          className="h-10 w-10 rounded-lg bg-blue-500 text-white hover:bg-blue-500/90 flex items-center justify-center"
                        >
                          {isAddingComment ? (
                            <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="size-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer actions - sticky for long content */}
                  <div className="flex justify-center items-center gap-3 flex-wrap">
                    {selectedJob.job_url && (
                      <a
                        href={selectedJob.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 min-w-[140px] px-5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-500/90 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                        Åbn jobopslag
                      </a>
                    )}
                    
                    {/* Save job button - only show if user is authenticated */}
                    {user && (
                      <button
                        onClick={handleSaveJob}
                        disabled={isSaving}
                        className={`h-10 min-w-[140px] px-5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                          isSaved 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {isSaving ? (
                          <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isSaved ? (
                          <Trash2 className="size-4" />
                        ) : (
                          <Bookmark className="size-4" />
                        )}
                        {isSaved ? 'Fjern fra gemte' : 'Gem job'}
                      </button>
                    )}

                    {/* Copy link button */}
                    <button
                      onClick={handleCopyLink}
                      className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white transition-all duration-200 group relative flex items-center justify-center"
                      title={linkCopied ? 'Link kopieret!' : 'Kopiér link'}
                      aria-label="Kopiér link"
                    >
                      {linkCopied ? (
                        <Check className="size-4 text-green-400" aria-hidden="true" />
                      ) : (
                        <Copy className="size-4" aria-hidden="true" />
                      )}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs text-white bg-black/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                        {linkCopied ? 'Link kopieret!' : 'Kopiér link'}
                      </div>
                    </button>
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