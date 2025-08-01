'use client'

import { motion } from 'framer-motion'
import { 
  ExternalLink, 
  MapPin, 
  Building2, 
  Calendar
} from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import { Job } from '@/types/job'
import ScoreBar from './ScoreBar'
import { formatDate, truncateText } from '@/utils/format'

export default function JobTable() {
  const { paginatedJobs, openJobModal } = useJobStore()

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
      className="card overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 sticky top-0 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Firma
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Titel
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Lokation
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Dato
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Link
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Uddrag
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
                className="hover:bg-white/3 transition-colors cursor-pointer group"
              >
                {/* Score */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <ScoreBar score={job.cfo_score} className="w-16" />
                    <span className="text-xs text-slate-400">
                      {job.cfo_score !== null ? `${job.cfo_score}/3` : '—'}
                    </span>
                  </div>
                </td>

                {/* Company */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-slate-400" />
                    <span className="text-slate-200 font-medium">
                      {job.company || 'Ukendt firma'}
                    </span>
                  </div>
                </td>

                {/* Title */}
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <span className="text-slate-200 font-medium">
                      {job.title || 'Ingen titel'}
                    </span>
                  </div>
                </td>

                {/* Location */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-slate-400" />
                    <span className="text-slate-200">
                      {job.location || 'Ukendt lokation'}
                    </span>
                  </div>
                </td>

                {/* Date */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-slate-400" />
                    <span className="text-slate-200">
                      {formatDate(job.publication_date)}
                    </span>
                  </div>
                </td>

                {/* Link */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {job.job_url ? (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors group/link"
                    >
                      <ExternalLink className="size-4 group-hover/link:scale-110 transition-transform" />
                    </a>
                  ) : (
                    <span className="text-slate-500">Ingen link</span>
                  )}
                </td>

                {/* Excerpt */}
                <td className="px-6 py-4">
                  <div className="max-w-xs">
                    <p className="text-slate-300 text-sm line-clamp-2">
                      {truncateText(job.description, 80)}
                    </p>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
} 