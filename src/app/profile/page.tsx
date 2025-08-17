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
import DescriptionClamp from '@/components/DescriptionClamp'
import UnifiedJobModal from '@/components/UnifiedJobModal'

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
      // setScoreFilter(null) // Removed score filter
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
    // if (scoreFilter !== null) { // Removed score filter
    //   list = list.filter(j => j.score === scoreFilter)
    // }
    
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
  }, [savedJobs, // Removed scoreFilter
    sortKey, sortDir])

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
        {/* Profile summary - using exact same card structure as dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          {/* User Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
          >
            <div className="absolute inset-0 bg-gradient-radial from-white/[0.02] via-transparent to-transparent rounded-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between px-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-indigo-600/90 transition-all duration-200 group-hover:scale-[1.02]">
                    <span className="text-lg font-semibold text-white">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-400 font-medium">Profil</h3>
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                <p className="text-4xl font-semibold tracking-tight text-white leading-none tabular-nums">
                  {user.name}
                </p>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {user.email}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Saved Jobs Card */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
            className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
          >
            <div className="absolute inset-0 bg-gradient-radial from-white/[0.02] via-transparent to-transparent rounded-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between px-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-white/5 ring-white/10 transition-all duration-200 group-hover:scale-[1.02]">
                    <Bookmark className="w-5 h-5 text-slate-300 opacity-80" />
                  </div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-400 font-medium">Gemte Jobs</h3>
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                <p className="text-4xl font-semibold tracking-tight text-white leading-none tabular-nums">
                  {savedJobs.length.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Jobopslag du har gemt
                </p>
              </div>
            </div>
          </motion.div>

          {/* Comments Card */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
            className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
          >
            <div className="absolute inset-0 bg-gradient-radial from-white/[0.02] via-transparent to-transparent rounded-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between px-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-white/5 ring-white/10 transition-all duration-200 group-hover:scale-[1.02]">
                    <MessageSquare className="w-5 h-5 text-slate-300 opacity-80" />
                  </div>
                  <h3 className="text-xs uppercase tracking-wide text-slate-400 font-medium">Kommentarer</h3>
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                <p className="text-4xl font-semibold tracking-tight text-white leading-none tabular-nums">
                  {comments.length.toLocaleString()}
                </p>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Kommentarer du har skrevet
                </p>
              </div>
            </div>
          </motion.div>
        </div>

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
                    {/* Removed Score Filter buttons */}
                    
                    {/* Reset Filters Button */}
                    {jobStatusFilter !== 'active' && (
                      <button
                        onClick={() => {
                          setJobStatusFilter('active')
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white transition"
                        title="Nulstil filtre"
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
                      onClick={() => handleOpenJob(savedJob)}
                      className="w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-4 text-left overflow-hidden tap-highlight-none active:scale-[0.99] transition-all duration-200 shadow-md hover:shadow-lg hover:border-white/30 select-none cursor-pointer max-w-full"
                      style={{ maxWidth: '100%', width: '100%' }}
                    >
                      {/* Header with company and score badge */}
                      <div className="flex items-start justify-between mb-3 min-w-0 w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Building2 className="size-4 text-slate-400" />
                          <span className="text-sm text-slate-300 font-medium truncate min-w-0">
                            {savedJob.company || 'Ukendt firma'}
                          </span>
                        </div>
                        
                        {/* Score badge */}
                        {savedJob.score && (
                          <div className="ml-2">
                            <ScoreBadge score={savedJob.score} size="sm" />
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div className="mb-3 min-w-0 w-full">
                        <h3 className="text-base font-semibold text-white leading-tight line-clamp-2 break-words">
                          {savedJob.title || 'Ingen titel'}
                        </h3>
                      </div>

                      {/* Meta line: Location + Date + Comments + Delete */}
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3 min-w-0 w-full">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <MapPin className="size-4 opacity-70" />
                          <span className="truncate min-w-0">
                            {savedJob.location || 'Ukendt lokation'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <Calendar className="size-4 opacity-70" />
                          <span className="truncate">{formatDate(savedJob.publication_date)}</span>
                        </div>

                        {/* Comments placeholder (since we don't have comment count for saved jobs) */}
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="size-4 opacity-70" />
                          <span className="text-xs font-medium">—</span>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSavedJob(savedJob.saved_job_id)
                          }}
                          className="p-1.5 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          title="Fjern fra gemte jobs"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {/* Description excerpt (if available) */}
                      {savedJob.description && (
                        <div className="text-sm text-slate-300 leading-relaxed min-w-0 w-full">
                          <DescriptionClamp text={savedJob.description} lines={2} className="text-slate-300" />
                        </div>
                      )}

                      {/* Notes (if available) */}
                      {savedJob.notes && (
                        <div className="text-sm text-slate-300 leading-relaxed min-w-0 w-full">
                          <strong>Noter:</strong> {savedJob.notes}
                        </div>
                      )}

                      {/* Saved time */}
                      <div className="text-xs text-slate-500 mt-2">
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
                      onClick={() => handleOpenComment(comment)}
                      className="w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-4 text-left overflow-hidden tap-highlight-none active:scale-[0.99] transition-all duration-200 shadow-md hover:shadow-lg hover:border-white/30 select-none cursor-pointer max-w-full"
                      style={{ maxWidth: '100%', width: '100%' }}
                    >
                      {/* Header with company */}
                      <div className="flex items-start justify-between mb-3 min-w-0 w-full">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Building2 className="size-4 text-slate-400" />
                          <span className="text-sm text-slate-300 font-medium truncate min-w-0">
                            {comment.company || 'Ukendt firma'}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <div className="mb-3 min-w-0 w-full">
                        <h3 className="text-base font-semibold text-white leading-tight line-clamp-2 break-words">
                          {comment.job_title || 'Ingen titel'}
                        </h3>
                      </div>

                      {/* Meta line: Date + Comments + Delete */}
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3 min-w-0 w-full">
                        <div className="flex items-center gap-1.5 tabular-nums flex-1">
                          <Calendar className="size-4 opacity-70" />
                          <span className="truncate">{getRelativeTime(comment.created_at)}</span>
                        </div>

                        {/* Comments placeholder */}
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="size-4 opacity-70" />
                          <span className="text-xs font-medium">1</span>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteComment(comment.id)
                          }}
                          className="p-1.5 rounded-lg transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          title="Slet kommentar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>

                      {/* Comment text */}
                      {comment.comment && (
                        <div className="text-sm text-slate-300 leading-relaxed min-w-0 w-full">
                          {comment.comment}
                        </div>
                      )}

                      {/* Commented time */}
                      <div className="text-xs text-slate-500 mt-2">
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
      <UnifiedJobModal />
    </div>
  )
} 