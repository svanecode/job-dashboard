'use client'

import { motion } from 'framer-motion'
import { 
  ExternalLink, 
  MapPin, 
  Building2, 
  Calendar,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import { Job } from '@/types/job'
import ScoreBar from './ScoreBar'
import { formatDate } from '@/utils/format'
import { getAriaSort, type SortKey, type SortDirection } from '@/utils/sort'

export default function JobTable() {
  const { paginatedJobs, openJobModal, sort, setSort } = useJobStore()

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

  if (paginatedJobs.length === 0) {
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
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="card overflow-x-hidden"
    >
      <div className="overflow-x-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-black/30 backdrop-blur-sm sticky top-0">
            <tr>
              <th className="w-[130px] px-4 py-4">
                <button
                  onClick={() => handleSort('score')}
                  className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
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
              <th className="md:w-[28%] px-4 py-4">
                <button
                  onClick={() => handleSort('company')}
                  className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
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
              <th className="md:w-[40%] px-4 py-4">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
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
              <th className="md:w-[20%] px-4 py-4">
                <button
                  onClick={() => handleSort('location')}
                  className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
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
                  className="flex items-center gap-1 text-left w-full select-none text-xs font-medium text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 ring-white/20 focus-visible:outline-none"
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
                <td className="px-4 py-4 whitespace-nowrap">
                  <ScoreBar score={job.cfo_score} />
                </td>

                {/* Company */}
                <td className="px-4 py-4 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="size-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-200 font-medium truncate">
                      {job.company || 'Ukendt firma'}
                    </span>
                  </div>
                </td>

                {/* Title */}
                <td className="px-4 py-4 min-w-0">
                  <span className="text-slate-200 font-medium line-clamp-1">
                    {job.title || 'Ingen titel'}
                  </span>
                </td>

                {/* Location */}
                <td className="px-4 py-4 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="size-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-200 truncate">
                      {job.location || 'Ukendt lokation'}
                    </span>
                  </div>
                </td>

                {/* Date */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-slate-400" />
                    <span className="text-slate-200 tabular-nums text-sm">
                      {formatDate(job.publication_date)}
                    </span>
                  </div>
                </td>

                {/* Link */}
                <td className="px-4 py-4 whitespace-nowrap">
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
  )
} 