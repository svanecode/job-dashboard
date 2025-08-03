'use client'

import { motion } from 'framer-motion'
import ScoreBadge from './ScoreBadge'

interface ScoreSummaryCardProps {
  count3: number
  count2: number
  count1: number
  className?: string
}

const scoreLabels = {
  3: { label: 'Akut', subline: 'Akut interim-behov' },
  2: { label: 'Relevant', subline: 'Relevant økonomirolle' },
  1: { label: 'Lav relevans', subline: 'Rutine/junior-rolle' }
} as const

export default function ScoreSummaryCard({ 
  count3, 
  count2, 
  count1, 
  className = '' 
}: ScoreSummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] p-3 sm:p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-xs uppercase tracking-wide text-slate-400 font-medium">
          Scoreoversigt
        </h2>
      </div>

      {/* Score Segments - Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
        {/* Score 3 - Akut */}
        <div className="group relative min-h-[84px] md:min-h-[96px] p-3 rounded-xl border border-white/10 bg-white/3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {scoreLabels[3].label}
            </span>
            <ScoreBadge score={3} size="sm" />
          </div>
          <div className="text-3xl font-semibold text-white leading-none tabular-nums">
            {count3.toLocaleString()}
          </div>
          <div className="text-[12px] text-slate-400 mt-1">
            {scoreLabels[3].subline}
          </div>
        </div>

        {/* Score 2 - Relevant */}
        <div className="group relative min-h-[84px] md:min-h-[96px] p-3 rounded-xl border border-white/10 bg-white/3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {scoreLabels[2].label}
            </span>
            <ScoreBadge score={2} size="sm" />
          </div>
          <div className="text-3xl font-semibold text-white leading-none tabular-nums">
            {count2.toLocaleString()}
          </div>
          <div className="text-[12px] text-slate-400 mt-1">
            {scoreLabels[2].subline}
          </div>
        </div>

        {/* Score 1 - Lav relevans */}
        <div className="group relative min-h-[84px] md:min-h-[96px] p-3 rounded-xl border border-white/10 bg-white/3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {scoreLabels[1].label}
            </span>
            <ScoreBadge score={1} size="sm" />
          </div>
          <div className="text-3xl font-semibold text-white leading-none tabular-nums">
            {count1.toLocaleString()}
          </div>
          <div className="text-[12px] text-slate-400 mt-1">
            {scoreLabels[1].subline}
          </div>
        </div>
      </div>
    </motion.div>
  )
} 