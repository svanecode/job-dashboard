'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
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
    const maxVisible = 7
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    // Always show first page
    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('...')
      }
    }

    for (let i = start; i <= end; i++) {
      if (i === 1 || i === totalPages || (i >= start && i <= end)) {
        pages.push(i)
      }
    }

    // Always show last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...')
      }
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="card p-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results Info */}
        <div className="text-sm text-slate-400">
          Viser <span className="text-white font-medium">{startItem}</span> til{' '}
          <span className="text-white font-medium">{endItem}</span> af{' '}
          <span className="text-white font-medium">{totalJobs}</span> jobs
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-white/10 rounded-lg text-slate-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Forrige</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <div className="flex items-center justify-center w-10 h-10 text-slate-400">
                    <MoreHorizontal className="size-4" />
                  </div>
                ) : (
                  <button
                    onClick={() => setCurrentPage(page as number)}
                    className={`flex items-center justify-center w-10 h-10 text-sm rounded-lg transition-all duration-200 focus-ring ${
                      page === currentPage
                        ? 'bg-kpmg-500 text-white font-medium shadow-lg shadow-kpmg-500/25'
                        : 'text-slate-300 hover:bg-white/5 border border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-white/10 rounded-lg text-slate-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-transparent"
          >
            <span className="hidden sm:inline">Næste</span>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Page Info */}
      <div className="mt-4 text-center text-xs text-slate-500">
        Side {currentPage} af {totalPages}
      </div>
    </motion.div>
  )
} 