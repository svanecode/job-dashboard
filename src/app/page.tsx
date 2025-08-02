'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useJobStore } from '@/store/jobStore'
import ScoreSummaryCard from '@/components/ScoreSummaryCard'
import FilterBar from '@/components/FilterBar'
import MobileFilterBar from '@/components/MobileFilterBar'
import JobTable from '@/components/JobTable'
import JobModal from '@/components/JobModal'
import ResultsCount from '@/components/ResultsCount'
import Pagination from '@/components/Pagination'

export default function Home() {
  const { 
    jobs, 
    totalJobs, 
    totalUrgentJobs,
    totalHighPriorityJobs,
    totalLowPriorityJobs,
    fetchJobs, 
    isLoading, 
    error,
    initializeFromURL,
    setFilters,
    applyFilters
  } = useJobStore()

  useEffect(() => {
    // Initialize filters from URL first
    initializeFromURL()
    // Then fetch jobs
    fetchJobs()
  }, [fetchJobs, initializeFromURL])



  return (
    <main className="bg-radial relative min-h-screen text-slate-200">
      {/* Noise overlay */}
      <div className="noise" />
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Header - Mobile container, Desktop centered */}
        <div className="container-mobile md:container mx-auto py-6 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-white mb-2">
              KPMG CFO Dashboard
            </h1>
            <p className="text-slate-400 text-lg">
              Find virksomheder der har behov for CFO Interim Assistance
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 mb-6 border-red-400/20 bg-red-400/5"
            >
              <p className="text-red-300 font-medium">Fejl: {error}</p>
            </motion.div>
          )}

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-8 text-center mb-6"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="size-12 rounded-full bg-white/5 flex items-center justify-center">
                  <div className="size-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                </div>
                <p className="text-slate-300">Indlæser jobs...</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Main content area - All components with same width */}
        <div className="container-mobile md:container mx-auto">
          {/* Score Summary Card */}
          <section className="mb-3 md:mb-4">
            <ScoreSummaryCard
              count3={totalUrgentJobs}
              count2={totalHighPriorityJobs}
              count1={totalLowPriorityJobs}
            />
          </section>

          {/* Desktop Filter Bar - Floating glass card */}
          <section className="mt-4 md:mt-6 mb-6">
            <FilterBar />
          </section>

          {/* Results Count */}
          <div className="mb-4">
            <ResultsCount />
          </div>

          {/* Job Table - Handles responsive display internally */}
          <div className="mb-6">
            <JobTable />
          </div>

          {/* Pagination */}
          <div className="mb-6">
            <Pagination />
          </div>
        </div>
      </div>

      {/* Mobile Filter Bar - Hidden on desktop */}
      <div className="md:hidden">
        <MobileFilterBar />
      </div>

      {/* Job Modal */}
      <JobModal />
    </main>
  )
}
