'use client'

import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, Building2, MapPin, Calendar, ExternalLink, Bookmark, Trash2, MessageSquare } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import { Job } from '@/types/job'
import { SortKey, SortDirection, getAriaSort } from '@/utils/sort'
import { formatDate } from '@/utils/format'
import CardRow from './CardRow'
import VirtualJobList from './VirtualJobList'
import ScoreBadge from './ScoreBadge'
import JobSheet from './JobSheet'
import { useState, useEffect } from 'react'
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
};

export default function JobTable({ initialData }: JobTableProps = {}) {
  const { paginatedJobs, openJobModal, sort, setSort, isLoading, setInitialData, rowDensity, currentPage } = useJobStore()
  const { user, initialized } = useAuth()
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [savingJobs, setSavingJobs] = useState<Set<string>>(new Set())

  // Handle initial data from SSR whenever it changes (e.g., URL page/filter changed)
  useEffect(() => {
    if (initialData) {
      setInitialData(initialData)
      console.log('Using initial data from SSR:', { page: initialData.page, count: initialData.data.length })
    }
  }, [initialData, setInitialData])

  // Load saved jobs and comment counts
  useEffect(() => {
    if (initialized && user && paginatedJobs.length > 0) {
      console.log('JobTable: Loading saved jobs for user:', user.id);
      loadSavedJobs()
      loadCommentCounts()
    } else if (initialized && !user) {
      console.log('JobTable: No user, clearing saved jobs state');
      setSavedJobs(new Set())
      setCommentCounts({})
    }
  }, [initialized, user, paginatedJobs])

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

  const handleSort = (key: SortKey) => {
    const newSort = {
      key,
      dir: (sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc') as SortDirection
    }
    setSort(newSort)
  }

  const handleRowClick = (job: Job) => {
    openJobModal(job)
  }

  const handleCardClick = (job: Job) => {
    setSelectedJob(job)
    setIsSheetOpen(true)
  }

  const handleSheetClose = () => {
    setIsSheetOpen(false)
    setSelectedJob(null)
  }

  if (paginatedJobs.length === 0 && !isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
            <Building2 className="size-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Ingen jobs fundet</h3>
            <p className="text-slate-400">Prøv at ændre dine filtre eller søgekriterier</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden lg:block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className={`w-full min-w-full table-fixed ${rowDensity === 'compact' ? 'text-[13px]' : 'text-[14px]'}`}>
            <thead className="bg-black/30 backdrop-blur-sm sticky top-0 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
              <tr>
                <th className="w-[6%] px-4 py-4">
                  <button
                    onClick={() => handleSort('score')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none cursor-pointer hover:underline"
                    aria-sort={getAriaSort('score', sort)}
                  >
                    Score
                    {sort.key === 'score' && (
                      sort.dir === 'asc' ? 
                        <ChevronUp className="size-3" /> : 
                        <ChevronDown className="size-3" />
                    )}
                  </button>
                </th>
                <th className="w-[12%] px-4 py-4">
                  <button
                    onClick={() => handleSort('company')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none cursor-pointer hover:underline"
                    aria-sort={getAriaSort('company', sort)}
                  >
                    Firma
                    {sort.key === 'company' && (
                      sort.dir === 'asc' ? 
                        <ChevronUp className="size-3" /> : 
                        <ChevronDown className="size-3" />
                    )}
                  </button>
                </th>
                <th className="w-[30%] px-4 py-4">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none cursor-pointer hover:underline"
                    aria-sort={getAriaSort('title', sort)}
                  >
                    Titel
                    {sort.key === 'title' && (
                      sort.dir === 'asc' ? 
                        <ChevronUp className="size-3" /> : 
                        <ChevronDown className="size-3" />
                    )}
                  </button>
                </th>
                <th className="w-[15%] px-4 py-4">
                  <button
                    onClick={() => handleSort('location')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none cursor-pointer hover:underline"
                    aria-sort={getAriaSort('location', sort)}
                  >
                    Lokation
                    {sort.key === 'location' && (
                      sort.dir === 'asc' ? 
                        <ChevronUp className="size-3" /> : 
                        <ChevronDown className="size-3" />
                    )}
                  </button>
                </th>
                <th className="w-[10%] px-4 py-4">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none cursor-pointer hover:underline"
                    aria-sort={getAriaSort('date', sort)}
                  >
                    Dato
                    {sort.key === 'date' && (
                      sort.dir === 'asc' ? 
                        <ChevronUp className="size-3" /> : 
                        <ChevronDown className="size-3" />
                    )}
                  </button>
                </th>
                <th className="w-[8%] px-4 py-4">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center block">Kommentarer</span>
                </th>
                <th className="w-[8%] px-4 py-4">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider text-center block">Gem</span>
                </th>
                <th className="w-[6%] px-4 py-4">
                  <span className="sr-only">Link</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedJobs.map((job) => (
                <tr
                  key={job.id}
                  onClick={() => handleRowClick(job)}
                  className={`hover:bg-white/5 transition-colors cursor-pointer group ${rowDensity === 'compact' ? 'h-11' : 'h-14'}`}
                >
                  {/* Score */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[6%]`}>
                    <ScoreBadge score={job.cfo_score || 0} />
                  </td>

                  {/* Company */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} min-w-0 w-[12%]`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="size-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-200 font-medium truncate text-sm">
                        {job.company || 'Ukendt firma'}
                      </span>
                    </div>
                  </td>

                  {/* Title */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} min-w-0 w-[30%]`}>
                    <span className="text-slate-200 font-medium line-clamp-1 text-sm">
                      {job.title || 'Ingen titel'}
                    </span>
                  </td>

                  {/* Location */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} min-w-0 w-[15%]`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="size-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-200 truncate text-sm">
                        {job.location || 'Ukendt lokation'}
                      </span>
                    </div>
                  </td>

                  {/* Date (created_at) */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[10%]`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-slate-400" />
                      <span className="text-slate-200 tabular-nums text-sm">
                        {formatDate(job.created_at || job.publication_date)}
                      </span>
                    </div>
                  </td>

                  {/* Comments */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[8%] text-center`}>
                    <div className="flex items-center gap-1.5 justify-center">
                      <MessageSquare className="size-4 text-slate-400" />
                      <span className="text-slate-200 text-sm font-medium">
                        {commentCounts[job.job_id] || 0}
                      </span>
                    </div>
                  </td>

                  {/* Save/Unsave */}
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[8%] text-center`}>
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
                  <td className={`px-4 ${rowDensity === 'compact' ? 'py-2.5' : 'py-4'} whitespace-nowrap w-[6%]`}>
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

      {/* Mobile Card List - Hidden on desktop */}
      <div className="lg:hidden pb-24 with-fab-bottom overflow-hidden w-full max-w-full">
        {isLoading ? (
          // Skeleton loading state
          <div className="grid gap-4 w-full max-w-full">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="w-full max-w-full"
              >
                <div className="relative">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <SkeletonCard />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedJobs.length > 250 ? (
          // Virtual list for large datasets
          <div className="h-[calc(100vh-300px)] overflow-hidden w-full max-w-full">
            <VirtualJobList 
              jobs={paginatedJobs} 
              onOpen={handleCardClick}
              commentCounts={commentCounts}
              savedJobs={savedJobs}
              savingJobs={savingJobs}
              onSave={(job) => handleSaveJob(job, {} as React.MouseEvent)}
            />
          </div>
        ) : (
          // Regular grid for smaller datasets
          <div className="grid gap-4 w-full max-w-full">
            {paginatedJobs.map((job) => (
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

      {/* Job Sheet Modal */}
      {selectedJob && (
          <JobSheet
          open={isSheetOpen}
          onClose={handleSheetClose}
          title={selectedJob.title || 'Ingen titel'}
          company={selectedJob.company || 'Ukendt firma'}
          location={selectedJob.location || 'Ukendt lokation'}
            date={(selectedJob.created_at || selectedJob.publication_date || '') as string}
          score={selectedJob.cfo_score || 0}
          description={selectedJob.description || ''}
          jobUrl={selectedJob.job_url || undefined}
          tags={[]}
          jobId={selectedJob.job_id}
        />
      )}
    </>
  )
} 