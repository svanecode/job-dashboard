'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useJobStore } from '@/store/jobStore'

export default function Pagination() {
  const { totalJobs, totalPages, currentPage, jobsPerPage, setCurrentPage } = useJobStore()

  const startItem = (currentPage - 1) * jobsPerPage + 1
  const endItem = Math.min(currentPage * jobsPerPage, totalJobs)

  if (totalPages <= 1) {
    return null
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="card p-4"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Viser {startItem}-{endItem} af {totalJobs} jobs
        </div>
        
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-white/10 rounded-lg text-slate-300 hover:border-white/20 hover:bg-white/5 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4" />
            Forrige
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors focus-ring ${
                  page === currentPage
                    ? 'bg-primary text-ink font-medium'
                    : 'text-slate-300 hover:bg-white/5 border border-white/10 hover:border-white/20'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm border border-white/10 rounded-lg text-slate-300 hover:border-white/20 hover:bg-white/5 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Næste
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
} 