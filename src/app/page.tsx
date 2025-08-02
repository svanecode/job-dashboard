'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useJobStore } from '@/store/jobStore'
import StatCard from '@/components/StatCard'
import FilterBar from '@/components/FilterBar'
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
    error 
  } = useJobStore()

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return (
    <main className="bg-radial relative min-h-screen text-slate-200">
      {/* Noise overlay */}
      <div className="noise" />
      
      {/* Main content */}
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:py-10 relative z-10">
        {/* Header */}
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

        {/* KPI Overview */}
        <section className="grid gap-4 sm:grid-cols-3 mb-8">
          <StatCard 
            title="Akut behov" 
            icon="flame" 
            count={totalUrgentJobs} 
            level={3} 
          />
          <StatCard 
            title="Høj prioritet" 
            icon="trend" 
            count={totalHighPriorityJobs} 
            level={2} 
          />
          <StatCard 
            title="Lav relevans" 
            icon="bag" 
            count={totalLowPriorityJobs} 
            level={1} 
          />
        </section>

        {/* Filter Bar */}
        <FilterBar />

        {/* Results Count */}
        <div className="mb-4">
          <ResultsCount />
        </div>

        {/* Job Table */}
        <div className="mb-6">
          <JobTable />
        </div>

        {/* Pagination */}
        <div className="mb-6">
          <Pagination />
        </div>
      </div>

      {/* Job Modal */}
      <JobModal />
    </main>
  )
}
