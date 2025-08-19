'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Copy, MapPin, Calendar, Building2, Bookmark, Trash2, Send } from 'lucide-react'
import DescriptionClamp from './DescriptionClamp'
import ScoreBadge from './ScoreBadge'
import { formatDate } from '@/utils/format'
import { savedJobsService } from '@/services/savedJobsService'
import { useAuth } from '@/contexts/AuthContext'

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
  jobId: string
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
  tags = [],
  jobId
}: JobSheetProps) {
  const { user } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [dragDistance, setDragDistance] = useState(0)
  const [linkCopied, setLinkCopied] = useState(false)
  const touchStartY = useRef<number>(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)

  // Valider at job data er komplet
  useEffect(() => {
    if (open && (!jobId || !title || !company)) {
      console.error('JobSheet: Invalid job data:', { jobId, title, company });
      alert('Jobbet mangler nogle oplysninger. Prøv at opdatere siden.');
      onClose();
      return;
    }
  }, [open, jobId, title, company, onClose]);

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

  // Load saved status and comments when opening or job changes
  useEffect(() => {
    const load = async () => {
      if (!open || !jobId) return
      try {
        if (user) {
          const saved = await savedJobsService.isJobSaved(jobId)
          setIsSaved(!!saved)
        } else {
          setIsSaved(false)
        }
      } catch (e) {
        setIsSaved(false)
      }
      try {
        setIsLoadingComments(true)
        const list = await savedJobsService.getJobComments(jobId)
        setComments(list)
      } catch (e) {
        setComments([])
      } finally {
        setIsLoadingComments(false)
      }
    }
    load()
  }, [open, jobId, user])

  const handleSaveToggle = async () => {
    if (!user) {
      alert('Du skal være logget ind for at gemme jobs')
      return
    }
    if (!jobId) return
    try {
      setIsSaving(true)
      if (isSaved) {
        const savedJobs = await savedJobsService.getSavedJobs()
        const savedJob = savedJobs.find(sj => sj.job_id === jobId)
        if (savedJob) {
          await savedJobsService.deleteSavedJob(savedJob.saved_job_id)
          setIsSaved(false)
        }
      } else {
        await savedJobsService.saveJob({ job_id: jobId })
        setIsSaved(true)
      }
    } catch (error) {
      console.error('Error saving/unsaving job:', error)
      alert(`Kunne ikke ${isSaved ? 'fjerne' : 'gemme'} job`)
    } finally {
      setIsSaving(false)
    }
  }

  const getRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    const daysAgo = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    if (daysAgo === 0) return 'i dag'
    if (daysAgo === 1) return 'i går'
    return `for ${daysAgo} dage siden`
  }

  const handleAddComment = async () => {
    if (!user || !jobId || !newComment.trim()) return
    try {
      setIsAddingComment(true)
      await savedJobsService.addComment(jobId, newComment.trim())
      setNewComment('')
      const list = await savedJobsService.getJobComments(jobId)
      setComments(list)
    } catch (e) {
      alert('Kunne ikke tilføje kommentar')
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !commentId) return
    try {
      await savedJobsService.deleteComment(commentId)
      const list = await savedJobsService.getJobComments(jobId)
      setComments(list)
    } catch (e) {
      alert('Kunne ikke slette kommentar')
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
            className="fixed inset-0 z-[80] bg-black/60"
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
            className="fixed bottom-0 left-0 right-0 z-[90] rounded-t-3xl border border-white/10 bg-neutral-950 shadow-[0_-16px_60px_rgba(0,0,0,0.55)] max-h-[90vh] overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-12 rounded-full bg-white/20" />
            </div>

            {/* Content */}
            <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))] overflow-y-auto max-h-[70vh]">
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

              {/* Comments */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-neutral-400 mb-3">Kommentarer</h3>
                <div className="space-y-3 mb-4">
                  {isLoadingComments ? (
                    <div className="text-center py-4">
                      <div className="size-6 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-neutral-400">Indlæser kommentarer...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-neutral-500 italic">Ingen kommentarer endnu.</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{comment.user_name || 'Anonymous'}</span>
                            <span className="text-xs text-neutral-400">{getRelativeTime(comment.created_at)}</span>
                          </div>
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
                {user && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Skriv en kommentar..."
                      className="h-10 rounded-lg bg-white/5 border border-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
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
            <div className="sticky bottom-0 px-4 pb-4 pt-3 bg-neutral-950 border-t border-white/10">
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
                  {user && (
                    <button
                      onClick={handleSaveToggle}
                      disabled={isSaving}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        isSaved
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/20'
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