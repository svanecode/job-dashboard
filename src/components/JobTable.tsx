'use client'

import { motion } from 'framer-motion'
import { Building2, MapPin, Calendar, ExternalLink, Bookmark, Trash2, MessageSquare } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import { Job } from '@/types/job'
import { SortKey, SortDirection } from '@/utils/sort'
import { formatDate } from '@/utils/format'
import CardRow from './CardRow'
import VirtualJobList from './VirtualJobList'
import ScoreBars from './ScoreBars'
import SortDropdown from './SortDropdown'

import FilterPopupButton from './FilterPopupButton'
import FilterBarDesktop from './FilterBarDesktop'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { savedJobsService } from '@/services/savedJobsService'

// Skeleton component for loading state
function SkeletonCard() {
  return (
    <div className="w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-4 animate-pulse max-w-full overflow-hidden">
      {/* Header with company and score badge */}
      <div className="flex items-start justify-between mb-3 min-w-0 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="size-4 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
        </div>
        <div className="h-6 bg-white/10 rounded-full w-16"></div>
      </div>

      {/* Title */}
      <div className="mb-3 min-w-0 w-full">
        <div className="h-5 bg-white/10 rounded w-3/4 mb-2"></div>
        <div className="h-5 bg-white/10 rounded w-1/2"></div>
      </div>

      {/* Meta line */}
      <div className="flex items-center gap-2 mb-3 min-w-0 w-full">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="size-4 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded w-20"></div>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="size-4 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded w-16"></div>
        </div>
      </div>

      {/* Excerpt */}
      <div className="space-y-2 min-w-0 w-full">
        <div className="h-4 bg-white/10 rounded w-full"></div>
        <div className="h-4 bg-white/10 rounded w-2/3"></div>
      </div>
    </div>
  )
}

type Paged = {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type JobTableProps = {
  initialData?: Paged;
  initialPageSize?: number;
};

export default function JobTable({ initialData, initialPageSize }: JobTableProps = {}) {
  const { paginatedJobs, openJobModal, sort, setSort, setInitialData, rowDensity, currentPage, jobsPerPage, setJobsPerPage, resetFilters } = useJobStore()
  const { user, initialized } = useAuth()
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [savingJobs, setSavingJobs] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'table' | 'gallery'>('table')

  // Compute sorted jobs for client-side sorting (comments, saved)
  const sortedJobs = useMemo(() => {
    if (sort.key === 'comments' || sort.key === 'saved') {
      // Import sortJobs dynamically to avoid circular dependency
      const { sortJobs } = require('@/utils/sort');
      return sortJobs(paginatedJobs, sort, commentCounts, savedJobs);
    }
    return paginatedJobs;
  }, [paginatedJobs, sort, commentCounts, savedJobs]);


  // Handle initial data from SSR whenever it changes (e.g., URL page/filter changed)
  useEffect(() => {
    if (initialData) {
      setInitialData(initialData);
    }
  }, [initialData, setInitialData])

  // Initialize jobsPerPage from SSR if provided
  useEffect(() => {
    if (initialPageSize && jobsPerPage === 20) {
      setJobsPerPage(initialPageSize)
    }
  }, [initialPageSize, jobsPerPage, setJobsPerPage])

  // Load saved jobs and comment counts
  useEffect(() => {
    if (initialized && user && paginatedJobs.length > 0) {
      loadSavedJobs()
      loadCommentCounts()
    } else if (initialized && !user) {
      setSavedJobs(new Set())
      setCommentCounts({})
    }
  }, [initialized, user, paginatedJobs])

  // Handle client-side sorting for comments and saved jobs
  useEffect(() => {
    if (sort.key === 'comments' || sort.key === 'saved') {
      // Sortering håndteres automatisk via sortJobs funktionen når data vises
    }
  }, [sort.key, sort.dir, commentCounts, savedJobs])

  const loadSavedJobs = async () => {
    try {
      const savedJobsData = await savedJobsService.getSavedJobs()
      const savedJobIds = new Set(savedJobsData.map(job => job.job_id))
      setSavedJobs(savedJobIds)
    } catch (error) {
      console.error('Error loading saved jobs:', error)
      
      // Handle auth errors gracefully
      if (error instanceof Error && error.message.includes('Authentication required')) {
        console.warn('User authentication expired, clearing saved jobs state')
        setSavedJobs(new Set())
        // Optionally show a toast or notification to the user
        return
      }
      
      // For other errors, keep the existing saved jobs state
      // but log the error for debugging
    }
  }

  const loadCommentCounts = async () => {
    try {
      const commentCountsData: Record<string, number> = {}
      
      // Load comment counts for each job
      await Promise.all(
        paginatedJobs.map(async (job) => {
          try {
            const comments = await savedJobsService.getJobComments(job.job_id)
            commentCountsData[job.job_id] = comments.length
          } catch (error) {
            commentCountsData[job.job_id] = 0
          }
        })
      )
      
      setCommentCounts(commentCountsData)
    } catch (error) {
      console.error('Error loading comment counts:', error)
    }
  }

  const handleSaveJob = async (job: Job, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    
    if (!user) {
      alert('Du skal være logget ind for at gemme jobs')
      return
    }

    const jobId = job.job_id
    const isCurrentlySaved = savedJobs.has(jobId)
    
    try {
      setSavingJobs(prev => new Set(prev).add(jobId))
      
      if (isCurrentlySaved) {
        // Unsave job
        const savedJobsData = await savedJobsService.getSavedJobs()
        const savedJob = savedJobsData.find(sj => sj.job_id === jobId)
        
        if (savedJob) {
          await savedJobsService.deleteSavedJob(savedJob.saved_job_id)
          setSavedJobs(prev => {
            const newSet = new Set(prev)
            newSet.delete(jobId)
            return newSet
          })
        }
      } else {
        // Save job
        await savedJobsService.saveJob({ job_id: jobId })
        setSavedJobs(prev => new Set(prev).add(jobId))
      }
    } catch (error) {
      console.error('Error saving/unsaving job:', error)
      alert(`Kunne ikke ${isCurrentlySaved ? 'fjerne' : 'gemme'} job: ${error instanceof Error ? error.message : 'Ukendt fejl'}`)
    } finally {
      setSavingJobs(prev => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
    }
  }



  const handleRowClick = (job: Job) => {
    openJobModal(job)
  }

  const handleCardClick = (job: Job) => {
    openJobModal(job)
  }

  if (sortedJobs.length === 0) {
    return (
      <>
              {/* Desktop filter bar */}
        <div className="hidden md:block">
          <FilterBarDesktop />
        </div>
        
        {/* Vis kun filter-knappen på mobil */}
        <div className="md:hidden flex items-center justify-end mb-4">
          <FilterPopupButton />
        </div>

        <div className="card p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
              <Building2 className="size-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Ingen jobs fundet</h3>
              <p className="text-slate-400">Prøv at ændre dine filtre eller søgekriterier</p>
              <button 
                onClick={() => resetFilters()} 
                className="mt-4 px-4 py-2 bg-kpmg-500 hover:bg-kpmg-700 text-white rounded-lg transition-colors"
              >
                Nulstil filtre
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop filter bar */}
      <div className="hidden md:block">
        <FilterBarDesktop />
      </div>

      {/* View Toggle and Sort Controls - Desktop */}
      <div className="hidden lg:flex items-center justify-between mb-4">
        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Sortering:</div>
          <SortDropdown sort={sort} onSortChange={setSort} />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-400 uppercase tracking-wider mr-2">Visning:</div>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-kpmg-500 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Tabel
          </button>
          <button
            onClick={() => setViewMode('gallery')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'gallery'
                ? 'bg-kpmg-500 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            Galleri
          </button>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden space-y-3 mb-4">
        {/* Sort Controls */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Sortering:</div>
            <SortDropdown sort={sort} onSortChange={setSort} />
          </div>
        </div>

        {/* Filter Button Only - Removed View Toggle since both views are the same on mobile */}
        <div className="flex items-center justify-center">
          <FilterPopupButton />
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      {viewMode === 'table' && (
        <div className="hidden lg:block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className={`w-full min-w-full table-fixed ${rowDensity === 'compact' ? 'text-[13px]' : 'text-[14px]'}`}>
            <thead className="bg-black/30 backdrop-blur-sm sticky top-0 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
              <tr>
                <th className="w-[8%] px-4 py-4">
                  <div className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Score
                  </div>
                </th>
                <th className="w-[14%] px-4 py-4">
                  <div className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Firma
                  </div>
                </th>
                <th className="w-[32%] px-4 py-4">
                  <div className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Titel
                  </div>
                </th>
                <th className="w-[16%] px-4 py-4">
                  <div className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Lokation
                  </div>
                </th>
                <th className="w-[12%] px-4 py-4">
                  <div className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Dato
                  </div>
                </th>
                <th className="w-[12%] px-4 py-4">
                  <div className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Kommentarer
                  </div>
                </th>
                <th className="w-[10%] px-4 py-4">
                  <div className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Gem
                  </div>
                </th>
                <th className="w-[8%] px-4 py-4">
                  <span className="sr-only">Link</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedJobs.map((job: Job) => (
                <tr
                  key={job.id}
                  onClick={() => handleRowClick(job)}
                  className={`hover:bg-white/5 transition-colors cursor-pointer group ${rowDensity === 'compact' ? 'h-11' : 'h-14'}`}
                >
                  {/* Score */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[8%]`}>
                    {/* UDSKIFT ScoreBadge MED ScoreBars */}
                    <ScoreBars level={(job.cfo_score || 1) as 1 | 2 | 3} size="sm" />
                  </td>

                  {/* Company */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} min-w-0 w-[14%]`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="size-4 text-slate-500 flex-shrink-0" />
                      {/* Gør firma lidt mindre fremtrædende */}
                      <span className="text-slate-300 font-medium truncate text-sm"> 
                        {job.company || 'Ukendt firma'}
                      </span>
                    </div>
                  </td>

                  {/* Title */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} min-w-0 w-[32%]`}>
                    {/* GØR TITLEN MERE FREMTRÆDENDE */}
                    <span className="font-semibold text-white line-clamp-1 text-sm group-hover:text-slate-100 transition-colors">
                      {job.title || 'Ingen titel'}
                    </span>
                  </td>

                  {/* Location */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} min-w-0 w-[16%]`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="size-4 text-slate-500 flex-shrink-0" />
                      {/* Gør lokation lidt mindre fremtrædende */}
                      <span className="text-slate-400 truncate text-sm">
                        {job.location || 'Ukendt lokation'}
                      </span>
                    </div>
                  </td>

                  {/* Date (created_at) */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[12%]`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-slate-500" />
                      {/* Gør dato lidt mindre fremtrædende */}
                      <span className="text-slate-400 tabular-nums text-sm">
                        {formatDate(job.created_at || job.publication_date)}
                      </span>
                    </div>
                  </td>

                  {/* Comments */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[12%] text-center`}>
                    <div className="flex items-center gap-1.5 justify-center">
                      <MessageSquare className="size-4 text-slate-500" />
                      {/* Gør kommentarer lidt mindre fremtrædende */}
                      <span className="text-slate-400 text-sm font-medium">
                        {commentCounts[job.job_id] || 0}
                      </span>
                    </div>
                  </td>

                  {/* Save/Unsave */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[10%] text-center`}>
                    {user ? (
                      <button
                        onClick={(e) => handleSaveJob(job, e)}
                        disabled={savingJobs.has(job.job_id)}
                        className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none ${
                          savingJobs.has(job.job_id)
                            ? 'text-slate-500 cursor-not-allowed'
                            : savedJobs.has(job.job_id)
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                            : 'text-slate-400 hover:text-slate-300 hover:bg-white/10'
                        }`}
                        title={savedJobs.has(job.job_id) ? 'Fjern fra gemte' : 'Gem job'}
                      >
                        {savingJobs.has(job.job_id) ? (
                          <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : savedJobs.has(job.job_id) ? (
                          <Trash2 className="size-4" />
                        ) : (
                          <Bookmark className="size-4" />
                        )}
                      </button>
                    ) : (
                      <span className="text-slate-500 text-sm">—</span>
                    )}
                  </td>

                  {/* Link */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[8%]`}>
                    {job.job_url ? (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    ) : (
                      <span className="text-slate-500 text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Desktop Gallery View - Hidden on mobile */}
      {viewMode === 'gallery' && (
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            {sortedJobs.map((job: Job) => (
              <div
                key={job.id}
                className="group cursor-pointer"
                onClick={() => openJobModal(job)}
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200">
                  {/* Header with company and score */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Building2 className="size-5 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-300 font-medium truncate text-sm">
                        {job.company || 'Ukendt firma'}
                      </span>
                    </div>
                    <ScoreBars level={(job.cfo_score || 1) as 1 | 2 | 3} size="md" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-slate-100 transition-colors">
                    {job.title || 'Ingen titel'}
                  </h3>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="size-4" />
                      <span>{job.location || 'Ukendt lokation'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="size-4" />
                      <span>{formatDate(job.created_at || job.publication_date)}</span>
                    </div>
                  </div>

                  {/* Description excerpt */}
                  {job.description && (
                    <p className="text-slate-300 text-sm line-clamp-3 mb-4">
                      {job.description}
                    </p>
                  )}

                  {/* Footer with comments and actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="size-4" />
                        <span>{commentCounts[job.job_id] || 0}</span>
                      </div>
                      {user && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveJob(job, e)
                          }}
                          disabled={savingJobs.has(job.job_id)}
                          className={`flex items-center gap-2 transition-colors ${
                            savingJobs.has(job.job_id)
                              ? 'text-slate-500'
                              : savedJobs.has(job.job_id)
                              ? 'text-red-400 hover:text-red-300'
                              : 'hover:text-slate-300'
                          }`}
                        >
                          {savingJobs.has(job.job_id) ? (
                            <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : savedJobs.has(job.job_id) ? (
                            <Trash2 className="size-4" />
                          ) : (
                            <Bookmark className="size-4" />
                          )}
                          <span className="hidden xl:inline">
                            {savedJobs.has(job.job_id) ? 'Fjern' : 'Gem'}
                          </span>
                        </button>
                      )}
                    </div>
                    {job.job_url && (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Card List - Hidden on desktop */}
      <div className="lg:hidden pb-24 with-fab-bottom overflow-hidden w-full max-w-full">
        {viewMode === 'table' ? (
          // Mobile table view
          <div className="space-y-3">
            {sortedJobs.map((job: Job) => (
              <div
                key={job.id}
                className="w-full max-w-full"
              >
                <CardRow
                  title={job.title || 'Ingen titel'}
                  company={job.company || 'Ukendt firma'}
                  location={job.location || 'Ukendt lokation'}
                  date={(job.created_at || job.publication_date || '') as string}
                  score={job.cfo_score || 0}
                  excerpt={job.description || ''}
                  commentCount={commentCounts[job.job_id] || 0}
                  isSaved={savedJobs.has(job.job_id)}
                  isSaving={savingJobs.has(job.job_id)}
                  onOpen={() => handleCardClick(job)}
                  onSave={() => handleSaveJob(job, {} as React.MouseEvent)}
                />
              </div>
            ))}
          </div>
        ) : (
          // Mobile gallery view
          <div className="space-y-4">
            {sortedJobs.map((job: Job) => (
              <div
                key={job.id}
                className="w-full max-w-full"
              >
                <CardRow
                  title={job.title || 'Ingen titel'}
                  company={job.company || 'Ukendt firma'}
                  location={job.location || 'Ukendt lokation'}
                  date={(job.created_at || job.publication_date || '') as string}
                  score={job.cfo_score || 0}
                  excerpt={job.description || ''}
                  commentCount={commentCounts[job.job_id] || 0}
                  isSaved={savedJobs.has(job.job_id)}
                  isSaving={savingJobs.has(job.job_id)}
                  onOpen={() => handleCardClick(job)}
                  onSave={() => handleSaveJob(job, {} as React.MouseEvent)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
} 