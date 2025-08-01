'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExternalLink, 
  MapPin, 
  Building2, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Check
} from 'lucide-react'
import { useJobStore } from '@/store/jobStore'
import { Job } from '@/types/job'
import ScoreBar from './ScoreBar'
import { formatDate, truncateText, copyToClipboard, getScoreLabel } from '@/utils/format'

export default function JobTable() {
  const { paginatedJobs } = useJobStore()
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const toggleRow = (jobId: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedRows(newExpanded)
  }

  const handleCopyJob = async (job: Job) => {
    const text = `${job.company || 'Ukendt firma'} - ${job.title || 'Ingen titel'}`
    const success = await copyToClipboard(text)
    
    if (success) {
      setCopiedId(job.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, job: Job) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleRow(job.id)
    }
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
              <th className="px-6 py-4 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedJobs.map((job, index) => {
              const isExpanded = expandedRows.has(job.id)
              
              return (
                <>
                  {/* Main row */}
                  <motion.tr
                    key={`row-${job.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group"
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

                    {/* Expand button */}
                    <td className="px-6 py-4 w-8">
                      <button
                        onClick={() => toggleRow(job.id)}
                        onKeyDown={(e) => handleKeyDown(e, job)}
                        className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/10 transition-colors focus-ring"
                        aria-label={isExpanded ? 'Skjul detaljer' : 'Vis detaljer'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="size-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                  </motion.tr>

                  {/* Expanded details row */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        key={`details-${job.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white/2"
                      >
                        <td colSpan={8} className="px-6 py-6">
                          <div className="grid gap-6 sm:grid-cols-2">
                            {/* Left column */}
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                                  {job.title || 'Ingen titel'}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                  <span>{job.company || 'Ukendt firma'}</span>
                                  <span>•</span>
                                  <span>{job.location || 'Ukendt lokation'}</span>
                                  <span>•</span>
                                  <span>{formatDate(job.publication_date)}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-sm text-slate-400 mb-1">Score</p>
                                  <ScoreBar score={job.cfo_score} className="w-24" />
                                </div>
                                <div>
                                  <p className="text-sm text-slate-400 mb-1">Prioritet</p>
                                  <p className="text-sm text-slate-200">{getScoreLabel(job.cfo_score)}</p>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                {job.job_url && (
                                  <a
                                    href={job.job_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-kpmg-500 text-white rounded-lg hover:bg-kpmg-600 transition-colors focus-ring"
                                  >
                                    <ExternalLink className="size-4" />
                                    Åbn opslag
                                  </a>
                                )}
                                <button
                                  onClick={() => handleCopyJob(job)}
                                  className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-slate-300 hover:border-white/20 hover:bg-white/5 transition-colors focus-ring"
                                >
                                  {copiedId === job.id ? (
                                    <Check className="size-4 text-green-400" />
                                  ) : (
                                    <Copy className="size-4" />
                                  )}
                                  {copiedId === job.id ? 'Kopieret!' : 'Kopier firma+titel'}
                                </button>
                              </div>
                            </div>

                            {/* Right column - Description */}
                            <div>
                              <h4 className="text-sm font-medium text-slate-300 mb-3">Beskrivelse</h4>
                              <div className="bg-white/5 rounded-lg p-4">
                                <p className="text-slate-200 text-sm leading-relaxed">
                                  {job.description || 'Ingen beskrivelse tilgængelig'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
} 