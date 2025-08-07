'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useJobStore } from '@/store/jobStore'
import { savedJobsService } from '@/services/savedJobsService'
import { SavedJob, JobComment } from '@/types/job'
import { Bookmark, MessageSquare, Calendar, MapPin, Building2, ExternalLink, Trash2, ArrowLeft } from 'lucide-react'
import { formatDate, getRelativeTime } from '@/utils/format'
import ScoreBadge from '@/components/ScoreBadge'
import JobModal from '@/components/JobModal'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { openJobModal } = useJobStore()
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [comments, setComments] = useState<JobComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'jobs' | 'comments'>('jobs')

  useEffect(() => {
    // Wait for auth to be ready
    if (loading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    loadUserData()
  }, [user, loading, router])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      const [jobsData, commentsData] = await Promise.all([
        savedJobsService.getSavedJobs(),
        savedJobsService.getUserComments()
      ])
      setSavedJobs(jobsData)
      setComments(commentsData)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSavedJob = async (id: string) => {
    if (!confirm('Er du sikker på, at du vil fjerne dette job fra dine gemte jobs?')) return
    
    try {
      await savedJobsService.deleteSavedJob(id)
      setSavedJobs(prev => prev.filter(job => job.saved_job_id !== id))
    } catch (error) {
      console.error('Error deleting saved job:', error)
      alert('Kunne ikke slette job')
    }
  }

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Er du sikker på, at du vil slette denne kommentar?')) return
    
    try {
      await savedJobsService.deleteComment(id)
      setComments(prev => prev.filter(comment => comment.id !== id))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Kunne ikke slette kommentar')
    }
  }

  const handleOpenJob = (savedJob: SavedJob) => {
    // Create a job object that matches the Job interface
    const job = {
      id: 0, // This will be ignored by the modal
      job_id: savedJob.job_id,
      title: savedJob.title,
      job_url: savedJob.job_url,
      company: savedJob.company,
      company_url: null,
      location: savedJob.location,
      publication_date: savedJob.publication_date,
      description: savedJob.description,
      created_at: null,
      deleted_at: null,
      cfo_score: savedJob.score,
      scored_at: null,
      job_info: null,
      last_seen: null
    }
    
    openJobModal(job)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="size-5 text-white" />
              </button>
              <h1 className="text-xl font-semibold text-white">Min Profil</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-medium text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-white font-medium">{user.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="size-4" />
            Gemte Jobs ({savedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'comments'
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="size-4" />
            Kommentarer ({comments.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="size-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Indlæser bruger...</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="size-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Indlæser...</p>
          </div>
        ) : (
          <>
            {/* Saved Jobs Tab */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {savedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="size-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Ingen gemte jobs</h3>
                    <p className="text-slate-400">Du har ikke gemt nogen jobs endnu.</p>
                  </div>
                ) : (
                  savedJobs.map((savedJob) => (
                    <div 
                      key={savedJob.saved_job_id} 
                      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => handleOpenJob(savedJob)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {savedJob.title || 'Ingen titel'}
                            </h3>
                            {savedJob.score && <ScoreBadge score={savedJob.score} size="sm" />}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="size-4" />
                              {savedJob.company || 'Ukendt firma'}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="size-4" />
                              {savedJob.location || 'Ukendt lokation'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="size-4" />
                              {formatDate(savedJob.publication_date)}
                            </div>
                          </div>
                          {savedJob.notes && (
                            <p className="text-slate-300 text-sm mb-3">{savedJob.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {savedJob.job_url && (
                            <a
                              href={savedJob.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                              title="Åbn jobopslag"
                            >
                              <ExternalLink className="size-4 text-slate-400" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteSavedJob(savedJob.saved_job_id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                            title="Fjern fra gemte jobs"
                          >
                            <Trash2 className="size-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Gemt {getRelativeTime(savedJob.saved_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="size-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Ingen kommentarer</h3>
                    <p className="text-slate-400">Du har ikke skrevet nogen kommentarer endnu.</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-medium text-white">
                              Kommentar på: {comment.job_title || 'Ukendt job'}
                            </h3>
                            <span className="text-xs text-slate-500">
                              {getRelativeTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-slate-300">{comment.comment}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                          title="Slet kommentar"
                        >
                          <Trash2 className="size-4 text-red-400" />
                        </button>
                      </div>
                      {comment.job_url && (
                        <a
                          href={comment.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="size-3" />
                          Se jobopslag
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Job Modal */}
      <JobModal />
    </div>
  )
} 