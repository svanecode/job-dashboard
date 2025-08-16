'use client'

import { useEffect, useMemo, useState } from 'react'
import { useJobStore } from '@/store/jobStore'
import { getJobById, getJobsByIds } from '@/services/jobService'
import { motion } from 'framer-motion'
import JobModal from '@/components/JobModal'

type WeeklyInsightData = {
  id: string
  week_year: number
  week_number: number
  title: string
  intro?: string
  published_at?: string | null
  items: Array<{
    id: string
    company: string
    summary: string
    highlights?: string[]
    position?: number
    job_ids?: number[]
  }>
}

export default function InsightsWeekly({ insight }: { insight: WeeklyInsightData }) {
  const { openJobModal } = useJobStore()
  const [loadingJobId, setLoadingJobId] = useState<number | null>(null)
  const [prefetched, setPrefetched] = useState<Record<number, any>>({})

  // Prefetch mapped jobs to make modal open instantly
  const allJobIds = useMemo(() => {
    const ids = new Set<number>()
    for (const it of insight.items || []) {
      (it.job_ids || []).forEach((id) => ids.add(id))
    }
    return Array.from(ids)
  }, [insight.items])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!allJobIds.length) return
      const jobs = await getJobsByIds(allJobIds)
      if (cancelled) return
      const map: Record<number, any> = {}
      for (const j of jobs) map[j.id] = j
      setPrefetched(map)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [allJobIds])

  const handleOpenJobById = async (jobId: number) => {
    try {
      setLoadingJobId(jobId)
      const job = prefetched[jobId] || (await getJobById(jobId))
      if (job) {
        openJobModal(job)
      }
    } finally {
      setLoadingJobId(null)
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-4 md:mb-6">
        <div className="space-y-2">
          <h2 className="text-white text-xl md:text-2xl font-semibold leading-tight text-balance">{insight.title}</h2>
          {insight.intro && <p className="text-slate-300 text-base leading-relaxed max-w-2xl">{insight.intro}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-lg bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30 px-3 py-1 text-xs font-medium shadow-[inset_0_0_8px_rgba(59,130,246,0.25)]">
            Uge {String(insight.week_number).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {(insight.items || []).map((item) => (
          <div key={item.id} className="rounded-xl bg-transparent border-t border-white/10 p-4 md:p-6">
            {/* Gør firmanavnet større og mere fremtrædende */}
            <h3 className="text-lg font-semibold text-white leading-tight mb-2">{item.company}</h3>
            <p className="text-slate-300 text-base mt-1 leading-relaxed">{item.summary}</p>

            {item.highlights && item.highlights.length > 0 && (
              // Gør job-links mere "klikkebare"
              <div className="mt-4 space-y-2">
                {item.highlights.map((text, idx) => {
                  const jobId = item.job_ids?.[idx]
                  const isLoading = loadingJobId === jobId
                  return (
                    <div key={idx}>
                      {jobId ? (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleOpenJobById(jobId)}
                          className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
                          disabled={isLoading}
                          title="Åbn jobdetaljer"
                        >
                          {isLoading ? 'Åbner...' : text}
                        </motion.button>
                      ) : (
                        // Vis highlights uden link mere simpelt
                        <p className="text-slate-400 text-sm pl-4 border-l-2 border-white/10">{text}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Fallback: if there are mapped jobs but no matching highlight indices, show quick chips */}
            {(!item.highlights || (item.job_ids && item.job_ids.length > (item.highlights?.length || 0))) &&
              item.job_ids && item.job_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.job_ids.map((jid, i) => (
                    <motion.button
                      key={`${jid}-${i}`}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenJobById(jid)}
                      className="px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-xs md:text-sm hover:bg-white/10 hover:text-white"
                    >
                      Se job #{jid}
                    </motion.button>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Global job modal */}
      <JobModal />
    </article>
  )
}

