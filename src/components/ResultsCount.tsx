'use client'

import { motion } from 'framer-motion'
import { useJobStore } from '@/store/jobStore'

export default function ResultsCount() {
  const { totalJobs, jobs } = useJobStore()

  const currentJobsCount = jobs.length
  const isFiltered = currentJobsCount !== totalJobs

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mb-4"
    >
      <p className="text-sm text-slate-400">
        {isFiltered ? (
          <>
            Viser <span className="font-medium text-white">{currentJobsCount}</span> af <span className="font-medium text-white">{totalJobs}</span> jobs
          </>
        ) : (
          <>
            Viser alle <span className="font-medium text-white">{totalJobs}</span> jobs
          </>
        )}
      </p>
    </motion.div>
  )
} 