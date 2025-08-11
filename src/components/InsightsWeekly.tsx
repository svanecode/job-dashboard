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
    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="space-y-1">
          <h2 className="text-white text-lg font-medium">{insight.title}</h2>
          {insight.intro && <p className="text-slate-300">{insight.intro}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-lg bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30 px-3 py-1 text-xs font-medium shadow-[inset_0_0_8px_rgba(59,130,246,0.25)]">
            Uge {String(insight.week_number).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {(insight.items || []).map((item) => (
          <div key={item.id} className="rounded-lg bg-white/5 border border-white/10 p-3">
            <h3 className="text-white font-medium">{item.company}</h3>
            <p className="text-slate-300 text-sm mt-1">{item.summary}</p>

            {item.highlights && item.highlights.length > 0 && (
              <ul className="text-slate-300 text-sm mt-2 space-y-1">
                {item.highlights.map((text, idx) => {
                  const jobId = item.job_ids?.[idx]
                  const isLoading = loadingJobId === jobId
                  return (
                    <li key={idx}>
                      {jobId ? (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleOpenJobById(jobId)}
                          className="w-full text-left p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                          disabled={isLoading}
                          title="Åbn jobdetaljer"
                        >
                          <span className="underline decoration-dotted underline-offset-2">
                            {isLoading ? 'Åbner…' : text}
                          </span>
                        </motion.button>
                      ) : (
                        <span className="list-disc list-inside inline-block">{text}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Fallback: if there are mapped jobs but no matching highlight indices, show quick chips */}
            {(!item.highlights || (item.job_ids && item.job_ids.length > (item.highlights?.length || 0))) &&
              item.job_ids && item.job_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.job_ids.map((jid, i) => (
                    <motion.button
                      key={`${jid}-${i}`}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenJobById(jid)}
                      className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10 hover:text-white"
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

