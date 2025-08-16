'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useJobStore } from '@/store/jobStore'
import { savedJobsService } from '@/services/savedJobsService'
import { SavedJob, JobComment } from '@/types/job'
import { Bookmark, MessageSquare, Calendar, MapPin, Building2, ExternalLink, Trash2, ArrowLeft, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { formatDate, getRelativeTime } from '@/utils/format'
import ScoreBadge from '@/components/ScoreBadge'
import JobModal from '@/components/JobModal'

export default function ProfilePage() {
  // authLoading: Venter på at vide, om brugeren er logget ind.
  // jobsLoading: Venter på at hente jobs.
  const { user, loading: authLoading, initialized } = useAuth()
  const router = useRouter()
  const { openJobModal } = useJobStore()
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [comments, setComments] = useState<JobComment[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'jobs' | 'comments'>('jobs')
  const [scoreFilter, setScoreFilter] = useState<number | null>(null)
  const [jobStatusFilter, setJobStatusFilter] = useState<'active' | 'expired'>('active')
  const [sortKey, setSortKey] = useState<'saved_at' | 'score' | 'date'>('saved_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Gør datahentning til en 'useCallback' for stabilitet
  const loadUserData = useCallback(async () => {
    // Kør kun, hvis vi har en bruger.
    if (!user) {
      setSavedJobs([]) // Ryd listen, hvis brugeren logger ud
      setComments([])
      setJobsLoading(false)
      return
    }

    console.log(`🔍 Henter brugerdata for bruger ${user.id}, job status: ${jobStatusFilter}`);
    setJobsLoading(true)
    try {
      const [jobsData, commentsData] = await Promise.all([
        savedJobsService.getSavedJobs(jobStatusFilter === 'expired'),
        savedJobsService.getUserComments()
      ])
      setSavedJobs(jobsData)
      setComments(commentsData)
      // Reset score filter when loading new data
      setScoreFilter(null)
    } catch (error) {
      console.error('Error loading user data:', error)
      setSavedJobs([]) // Ryd listen ved fejl
      setComments([])
    } finally {
      // Sørg ALTID for at stoppe loading-indikatoren
      setJobsLoading(false)
    }
  }, [user, jobStatusFilter])

  // Denne useEffect reagerer nu på, at bruger-statussen er afklaret
  useEffect(() => {
    // Vent med at hente data, indtil vi ved, om en bruger er logget ind.
    if (!authLoading && initialized) {
      if (!user) {
        router.push('/login')
        return
      }
      loadUserData()
    }
  }, [authLoading, initialized, user, router, loadUserData])

  // Reload data when job status filter changes
  useEffect(() => {
    if (user && !jobsLoading) {
      loadUserData()
    }
  }, [jobStatusFilter, loadUserData])

  const handleDeleteSavedJob = async (id: string) => {
    try {
      await savedJobsService.deleteSavedJob(id)
      setSavedJobs(prev => prev.filter(job => job.saved_job_id !== id))
    } catch (error) {
      console.error('Error deleting saved job:', error)
      alert('Kunne ikke slette job')
    }
  }

  const handleDeleteComment = async (id: string) => {
    try {
      await savedJobsService.deleteComment(id)
      setComments(prev => prev.filter(comment => comment.id !== id))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Kunne ikke slette kommentar')
    }
  }

  // Derived: filtered + sorted saved jobs
  const visibleSavedJobs = useMemo(() => {
    let list = savedJobs
    
    // Apply score filter
    if (scoreFilter !== null) {
      list = list.filter(j => j.score === scoreFilter)
    }
    
    const sorted = [...list].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'score':
          return dir * ((a.score ?? 0) - (b.score ?? 0))
        case 'date':
          return dir * (new Date(a.publication_date).getTime() - new Date(b.publication_date).getTime())
        case 'saved_at':
        default:
          return dir * (new Date(a.saved_at).getTime() - new Date(b.publication_date).getTime())
      }
    })
    return sorted
  }, [savedJobs, scoreFilter, sortKey, sortDir])

  const toggleSort = (key: 'saved_at' | 'score' | 'date') => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
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
      last_seen: null,
      region: null
    }
    
    openJobModal(job)
  }

  const handleOpenComment = (comment: JobComment) => {
    const job = {
      id: 0,
      job_id: comment.job_id,
      title: comment.job_title ?? null,
      job_url: comment.job_url ?? null,
      company: comment.company ?? null,
      company_url: null,
      location: null,
      publication_date: null,
      description: null,
      created_at: null,
      deleted_at: null,
      cfo_score: null,
      scored_at: null,
      job_info: null,
      last_seen: null,
    }
    openJobModal(job as any)
  }

  // Viser en simpel loader, mens vi tjekker login-status
  if (authLoading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Viser en pænere loader, mens jobs hentes
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10 animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-white/10 rounded mb-2 w-1/2"></div>
          <div className="h-4 bg-white/10 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  )

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0b0f14]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/10 backdrop-blur relative">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
              >
                <ArrowLeft className="size-5 text-white" />
              </button>
              <h1 className="text-xl font-semibold text-white">Min Profil</h1>
            </div>
            {/* Removed duplicate user name display to avoid redundancy with global navigation */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.02] p-5 mb-6 relative overflow-hidden"
        >
          {/* Removed bright decorative orb for a more blended background */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-indigo-600/90 flex items-center justify-center text-lg font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)]">{user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="text-white font-medium text-base">{user.name}</div>
                <div className="text-slate-400 text-sm">{user.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <div className="text-xs text-slate-400">Gemte jobs</div>
                <div className="text-white text-lg font-semibold">{savedJobs.length}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <div className="text-xs text-slate-400">Kommentarer</div>
                <div className="text-white text-lg font-semibold">{comments.length}</div>
              </div>
              <div className="hidden sm:block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                <div className="text-xs text-slate-400">Seneste gemt</div>
                <div className="text-white text-sm font-medium truncate max-w-[120px]">{savedJobs[0]?.title || '—'}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-white/10 text-white shadow-inner'
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

        {jobsLoading ? (
          renderLoadingSkeleton()
        ) : (
          <>
            {/* Saved Jobs Tab */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {/* Quick filters + sort */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Job Status Filter */}
                    <button
                      onClick={() => setJobStatusFilter(jobStatusFilter === 'active' ? 'expired' : 'active')}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                        jobStatusFilter === 'expired'
                          ? 'bg-orange-500 text-white border-orange-500/40' 
                          : 'text-slate-300 border-white/10 hover:bg-white/5'
                      }`}
                      title={jobStatusFilter === 'active' ? 'Klik for at inkludere udløbede jobs' : 'Klik for kun at vise aktuelle jobs'}
                    >
                      {jobStatusFilter === 'active' ? 'Inkluder udløbede' : 'Udløbede inkluderet'}
                    </button>
                    
                    {/* Score Filter */}
                    {[null, 3, 2, 1].map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setScoreFilter(s as number | null)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                          scoreFilter === s
                            ? 'bg-white/15 text-white border-white/20'
                            : 'text-slate-300 border-white/10 hover:bg-white/5'
                        }`}
                        title={s ? `Kun score ${s}` : 'Alle'}
                      >
                        {s === null ? 'Alle' : `Score ${s}`}
                      </button>
                    ))}
                    
                    {/* Reset Filters Button */}
                    {(jobStatusFilter !== 'active' || scoreFilter !== null) && (
                      <button
                        onClick={() => {
                          setJobStatusFilter('active')
                          setScoreFilter(null)
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition"
                        title="Nulstil alle filtre"
                      >
                        Nulstil
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e)=>e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSort('saved_at') }}
                      className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-1 ${sortKey==='saved_at' ? 'bg-white/10 text-white border-white/20' : 'text-slate-300 border-white/10 hover:bg-white/5'}`}
                      title="Sorter efter gemt dato"
                    >
                      <ArrowUpDown className={`size-4 transition-transform ${sortKey==='saved_at' ? (sortDir==='asc' ? 'rotate-180' : '') : ''}`} /> Gemt
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSort('score') }}
                      className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-1 ${sortKey==='score' ? 'bg-white/10 text-white border-white/20' : 'text-slate-300 border-white/10 hover:bg-white/5'}`}
                      title="Sorter efter score"
                    >
                      <ArrowUpDown className={`size-4 transition-transform ${sortKey==='score' ? (sortDir==='asc' ? 'rotate-180' : '') : ''}`} /> Score
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSort('date') }}
                      className={`px-3 py-1.5 rounded-lg text-sm border flex items-center gap-1 ${sortKey==='date' ? 'bg-white/10 text-white border-white/20' : 'text-slate-300 border-white/10 hover:bg-white/5'}`}
                      title="Sorter efter dato"
                    >
                      <ArrowUpDown className={`size-4 transition-transform ${sortKey==='date' ? (sortDir==='asc' ? 'rotate-180' : '') : ''}`} /> Dato
                    </button>
                  </div>
                </div>
                {savedJobs.length === 0 ? (
              <div className="text-center py-12">
                    <Bookmark className="size-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Ingen gemte jobs</h3>
                    <p className="text-slate-400">Du har ikke gemt nogen jobs endnu.</p>
                  </div>
                ) : (
                  visibleSavedJobs.map((savedJob) => (
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
                    <div
                      key={comment.id}
                      className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => handleOpenComment(comment)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {comment.job_title || 'Ingen titel'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                            {comment.company && (
                              <div className="flex items-center gap-1">
                                <Building2 className="size-4" />
                                {comment.company}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="size-4" />
                              {getRelativeTime(comment.created_at)}
                            </div>
                          </div>
                          {comment.comment && (
                            <p className="text-slate-300 text-sm mb-3">{comment.comment}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {comment.job_url && (
                            <a
                              href={comment.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                              title="Åbn jobopslag"
                            >
                              <ExternalLink className="size-4 text-slate-400" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                            title="Slet kommentar"
                          >
                            <Trash2 className="size-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        Kommenteret {getRelativeTime(comment.created_at)}
                      </div>
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