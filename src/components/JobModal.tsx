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
        const savedJob = savedJobs.find(job => job.job_id === selectedJob.job_id)
        
        if (savedJob) {
          await savedJobsService.deleteSavedJob(savedJob.saved_job_id)
          setIsSaved(false)
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
    
    if (!confirm('Er du sikker på, at du vil slette denne kommentar?')) return
    
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
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 cursor-pointer"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className={`fixed z-50 flex items-center justify-center pointer-events-none ${
              isMobile 
                ? 'inset-0' 
                : 'inset-4'
            }`}
          >
            <div
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
              className={`relative rounded-2xl border border-white/20 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md shadow-[0_10px_50px_-10px_rgba(0,0,0,0.9)] overflow-hidden pointer-events-auto ${
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
                  <div className="relative p-4 border-b border-white/20 bg-gray-900/90 backdrop-blur">
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
                  <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur space-y-3">
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
                            className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
                          >
                            <ChevronLeft className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={handleNextJob}
                            disabled={!canGoNext}
                            className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
                          >
                            <ChevronRight className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                      
                      {/* Close button */}
                      <button
                        onClick={closeJobModal}
                        className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200 hover:shadow-lg hover:scale-105"
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

                  {/* Comments Section */}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-white">Kommentarer</h3>
                      {/* Removed show/hide toggle */}
                    </div>

                    {/* Comments list */}
                    <div className="space-y-3">
                      {isLoadingComments ? (
                        <div className="text-center py-4">
                          <div className="size-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm text-slate-400">Indlæser kommentarer...</p>
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">
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
                                <span className="text-xs text-slate-400">
                                  {getRelativeTime(comment.created_at)}
                                </span>
                              </div>
                              {/* Show delete button only for user's own comments */}
                              {user && comment.user_id === user.id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                  title="Slet kommentar"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-slate-300">{comment.comment}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add comment form */}
                    {user && (
                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Skriv en kommentar..."
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-white/20"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={isAddingComment || !newComment.trim()}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white text-sm font-medium transition-colors disabled:cursor-not-allowed"
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
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                      {selectedJob.job_url && (
                        <a
                          href={selectedJob.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#005EB8] hover:bg-[#0091DA] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
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
                          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isSaved 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/30'
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
                      
                      {/* Copy link as icon button with tooltip */}
                      <button
                        onClick={handleCopyLink}
                        className="ml-auto size-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 hover:shadow-lg hover:scale-105 group relative"
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