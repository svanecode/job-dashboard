'use client'

import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, Building2, MapPin, Calendar, ExternalLink } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import { Job } from '@/types/job'
import { SortKey, SortDirection, getAriaSort } from '@/utils/sort'
import { formatDate } from '@/utils/format'
import CardRow from './CardRow'
import VirtualJobList from './VirtualJobList'
import ScoreBadge from './ScoreBadge'
import JobSheet from './JobSheet'
import { useState } from 'react'

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

export default function JobTable() {
  const { paginatedJobs, openJobModal, sort, setSort, isLoading } = useJobStore()
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card p-8 text-center"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
            <Building2 className="size-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Ingen jobs fundet</h3>
            <p className="text-slate-400">Prøv at ændre dine filtre eller søgekriterier</p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      {/* Desktop Table - Hidden on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="hidden lg:block card overflow-hidden"
      >
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-full table-fixed">
            <thead className="bg-black/30 backdrop-blur-sm sticky top-0">
              <tr>
                <th className="w-[8%] px-4 py-4">
                  <button
                    onClick={() => handleSort('score')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
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
                <th className="w-[15%] px-4 py-4">
                  <button
                    onClick={() => handleSort('company')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
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
                <th className="w-[35%] px-4 py-4">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
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
                <th className="w-[20%] px-4 py-4">
                  <button
                    onClick={() => handleSort('location')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
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
                <th className="w-[12%] px-4 py-4">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
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
                <th className="w-[10%] px-4 py-4">
                  <span className="sr-only">Link</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedJobs.map((job, index) => (
                <motion.tr
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleRowClick(job)}
                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  {/* Score */}
                  <td className="px-4 py-4 whitespace-nowrap w-[8%]">
                    <ScoreBadge score={job.cfo_score || 0} />
                  </td>

                  {/* Company */}
                  <td className="px-4 py-4 min-w-0 w-[15%]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="size-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-200 font-medium truncate text-sm">
                        {job.company || 'Ukendt firma'}
                      </span>
                    </div>
                  </td>

                  {/* Title */}
                  <td className="px-4 py-4 min-w-0 w-[35%]">
                    <span className="text-slate-200 font-medium line-clamp-1 text-sm">
                      {job.title || 'Ingen titel'}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-4 py-4 min-w-0 w-[20%]">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="size-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-200 truncate text-sm">
                        {job.location || 'Ukendt lokation'}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 whitespace-nowrap w-[12%]">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-slate-400" />
                      <span className="text-slate-200 tabular-nums text-sm">
                        {formatDate(job.publication_date)}
                      </span>
                    </div>
                  </td>

                  {/* Link */}
                  <td className="px-4 py-4 whitespace-nowrap w-[10%]">
                    {job.job_url ? (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center text-slate-400 hover:text-white transition-colors focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
                        aria-label="Åbn opslag"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    ) : (
                      <span className="text-slate-500 text-sm">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Mobile Card List - Hidden on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="lg:hidden pb-20 with-fab-bottom overflow-hidden w-full max-w-full"
      >
        {isLoading ? (
          // Skeleton loading state
          <div className="grid gap-4 w-full max-w-full">
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="w-full max-w-full"
              >
                <SkeletonCard />
              </motion.div>
            ))}
          </div>
        ) : paginatedJobs.length > 250 ? (
          // Virtual list for large datasets
          <div className="h-[calc(100vh-300px)] overflow-hidden w-full max-w-full">
            <VirtualJobList 
              jobs={paginatedJobs} 
              onOpen={handleCardClick} 
            />
          </div>
        ) : (
          // Regular grid for smaller datasets
          <div className="grid gap-4 w-full max-w-full">
            {paginatedJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="w-full max-w-full"
              >
                <CardRow
                  title={job.title || 'Ingen titel'}
                  company={job.company || 'Ukendt firma'}
                  location={job.location || 'Ukendt lokation'}
                  date={job.publication_date || ''}
                  score={job.cfo_score || 0}
                  excerpt={job.description || ''}
                  onOpen={() => handleCardClick(job)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Job Sheet Modal */}
      {selectedJob && (
        <JobSheet
          open={isSheetOpen}
          onClose={handleSheetClose}
          title={selectedJob.title || 'Ingen titel'}
          company={selectedJob.company || 'Ukendt firma'}
          location={selectedJob.location || 'Ukendt lokation'}
          date={selectedJob.publication_date || ''}
          score={selectedJob.cfo_score || 0}
          description={selectedJob.description || ''}
          jobUrl={selectedJob.job_url || undefined}
          tags={[]}
        />
      )}
    </>
  )
} 