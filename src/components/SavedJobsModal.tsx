'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Bookmark, MessageSquare, Edit3, Trash2, Star, Calendar, MapPin, Building2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { SavedJob, JobComment } from '@/types/job'
import { savedJobsService } from '@/services/savedJobsService'
import { formatDate } from '@/utils/format'
import ScoreBadge from './ScoreBadge'

interface SavedJobsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SavedJobsModal({ isOpen, onClose }: SavedJobsModalProps) {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null)
  const [comments, setComments] = useState<JobComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadSavedJobs()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedJob) {
      loadComments(selectedJob.job_id)
      setNotes(selectedJob.notes || '')
    }
  }, [selectedJob])

  const loadSavedJobs = async () => {
    try {
      setIsLoading(true)
      const jobs = await savedJobsService.getSavedJobs()
      setSavedJobs(jobs)
    } catch (error) {
      console.error('Error loading saved jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadComments = async (jobId: string) => {
    try {
      const comments = await savedJobsService.getJobComments(jobId)
      setComments(comments)
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleSaveJob = async (jobId: string) => {
    try {
      await savedJobsService.saveJob({ job_id: jobId })
      await loadSavedJobs()
    } catch (error) {
      console.error('Error saving job:', error)
    }
  }

  const handleDeleteSavedJob = async (savedJobId: string) => {
    try {
      await savedJobsService.deleteSavedJob(savedJobId)
      await loadSavedJobs()
      if (selectedJob?.saved_job_id === savedJobId) {
        setSelectedJob(null)
      }
    } catch (error) {
      console.error('Error deleting saved job:', error)
    }
  }

  const handleUpdateNotes = async () => {
    if (!selectedJob) return
    
    try {
      await savedJobsService.updateSavedJob(selectedJob.saved_job_id, { notes })
      setEditingNotes(false)
      await loadSavedJobs()
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const handleAddComment = async () => {
    if (!selectedJob || !newComment.trim()) return
    
    try {
      await savedJobsService.addComment(selectedJob.job_id, newComment.trim())
      setNewComment('')
      await loadComments(selectedJob.job_id)
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedJob) return
    
    try {
      await savedJobsService.deleteComment(commentId)
      await loadComments(selectedJob.job_id)
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }



  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250 }}
            className="fixed inset-4 z-[60] flex items-center justify-center"
          >
            <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Bookmark className="size-6 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">Gemte Jobs</h2>
                  <span className="text-sm text-slate-400">({savedJobs.length})</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="size-5 text-slate-300" />
                </button>
              </div>

              <div className="flex h-full">
                {/* Left panel - Saved jobs list */}
                <div className="w-1/2 border-r border-white/10 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-6 text-center text-slate-400">Indlæser...</div>
                  ) : savedJobs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      <Bookmark className="size-12 mx-auto mb-4 opacity-50" />
                      <p>Ingen gemte jobs endnu</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {savedJobs.map((job) => (
                        <div
                          key={job.saved_job_id}
                          onClick={() => setSelectedJob(job)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedJob?.saved_job_id === job.saved_job_id
                              ? 'border-blue-400 bg-blue-400/10'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="size-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-300">{job.company}</span>
                            </div>
                                                         <div className="flex items-center gap-2">
                               <ScoreBadge score={job.score} size="sm" />
                             </div>
                          </div>
                          
                          <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{job.title}</h3>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="size-3" />
                              {job.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(job.publication_date)}
                            </div>
                            
                          </div>

                          {job.notes && (
                            <div className="mt-2 text-xs text-slate-400 line-clamp-2">
                              {job.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right panel - Job details and comments */}
                <div className="w-1/2 flex flex-col">
                  {selectedJob ? (
                    <>
                      {/* Job details */}
                      <div className="p-6 border-b border-white/10">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-2">{selectedJob.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                              <div className="flex items-center gap-1">
                                <Building2 className="size-4" />
                                {selectedJob.company}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="size-4" />
                                {selectedJob.location}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ScoreBadge score={selectedJob.score} size="md" />
                            <button
                              onClick={() => handleDeleteSavedJob(selectedJob.saved_job_id)}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 className="size-4 text-red-400" />
                            </button>
                          </div>
                        </div>

                        {/* Notes section */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-white">Noter</h4>
                            <button
                              onClick={() => setEditingNotes(!editingNotes)}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                            >
                              <Edit3 className="size-4 text-slate-400" />
                            </button>
                          </div>
                          {editingNotes ? (
                            <div className="space-y-2">
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white text-sm resize-none"
                                rows={3}
                                placeholder="Tilføj noter til dette job..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleUpdateNotes}
                                  className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm transition-colors"
                                >
                                  Gem
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNotes(false)
                                    setNotes(selectedJob.notes || '')
                                  }}
                                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                                >
                                  Annuller
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-white/5 border border-white/20 text-sm text-slate-300 min-h-[60px]">
                              {notes || 'Ingen noter endnu...'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comments section */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        <h4 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                          <MessageSquare className="size-4" />
                          Kommentarer fra teamet ({comments.length})
                        </h4>

                        {/* Add comment */}
                        <div className="mb-4">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white text-sm resize-none"
                            rows={2}
                            placeholder="Tilføj en kommentar til teamet..."
                          />
                          <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            className="mt-2 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-slate-500 text-white text-sm transition-colors"
                          >
                            Tilføj kommentar
                          </button>
                        </div>

                        {/* Comments list */}
                        <div className="space-y-3">
                          {comments.map((comment) => (
                            <div key={comment.id} className="p-3 rounded-lg bg-white/5 border border-white/20">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-blue-400">
                                    {comment.user_name}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {new Date(comment.created_at).toLocaleDateString('da-DK')}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 rounded hover:bg-red-500/20 transition-colors"
                                >
                                  <Trash2 className="size-3 text-red-400" />
                                </button>
                              </div>
                              <p className="text-sm text-slate-300">{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <Bookmark className="size-12 mx-auto mb-4 opacity-50" />
                        <p>Vælg et job for at se detaljer</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 