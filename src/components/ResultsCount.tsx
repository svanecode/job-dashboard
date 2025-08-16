'use client'

import { motion } from 'framer-motion'
import { useJobStore } from '@/store/jobStore'

export default function ResultsCount() {
  const { totalJobs, paginatedJobs } = useJobStore()

  const currentJobsCount = paginatedJobs.length
  const isFiltered = currentJobsCount !== totalJobs

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mb-4"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
        <span className="text-slate-400">Viser</span>
        <span className="text-white tabular-nums font-medium">{isFiltered ? currentJobsCount : totalJobs}</span>
        {isFiltered && (
          <>
            <span className="text-slate-400">af</span>
            <span className="text-white tabular-nums font-medium">{totalJobs}</span>
          </>
        )}
        <span className="text-slate-400">jobs</span>
      </div>
    </motion.div>
  )
} 