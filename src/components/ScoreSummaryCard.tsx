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
  // Safety checks for undefined/null values
  const safeCount3 = count3 ?? 0;
  const safeCount2 = count2 ?? 0;
  const safeCount1 = count1 ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] p-3 sm:p-4 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -inset-40 bg-[radial-gradient(closest-side,rgba(255,255,255,0.06),transparent)]" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 relative">
        <h2 className="text-xs uppercase tracking-wide text-slate-400 font-medium">
          Scoreoversigt
        </h2>
      </div>

      {/* Score Segments - Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 relative">
        {/* Score 3 - Akut (neutral) */}
        <div className="group relative min-h-[84px] md:min-h-[96px] p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {scoreLabels[3].label}
            </span>
            <span className="inline-flex items-center rounded-full font-medium bg-white/10 text-white border border-white/15 px-2 py-0.5 text-xs">Akut</span>
          </div>
          <div className="text-3xl font-semibold text-white leading-none tabular-nums">
            {safeCount3.toLocaleString()}
          </div>
          <div className="text-[12px] text-slate-400 mt-1">
            {scoreLabels[3].subline}
          </div>
        </div>

        {/* Score 2 - Relevant (neutral) */}
        <div className="group relative min-h-[84px] md:min-h-[96px] p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {scoreLabels[2].label}
            </span>
            <span className="inline-flex items-center rounded-full font-medium bg-white/10 text-white border border-white/15 px-2 py-0.5 text-xs">Relevant</span>
          </div>
          <div className="text-3xl font-semibold text-white leading-none tabular-nums">
            {safeCount2.toLocaleString()}
          </div>
          <div className="text-[12px] text-slate-400 mt-1">
            {scoreLabels[2].subline}
          </div>
        </div>

        {/* Score 1 - Lav relevans (neutral) */}
        <div className="group relative min-h-[84px] md:min-h-[96px] p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {scoreLabels[1].label}
            </span>
            <span className="inline-flex items-center rounded-full font-medium bg-white/10 text-white border border-white/15 px-2 py-0.5 text-xs">Lav</span>
          </div>
          <div className="text-3xl font-semibold text-white leading-none tabular-nums">
            {safeCount1.toLocaleString()}
          </div>
          <div className="text-[12px] text-slate-400 mt-1">
            {scoreLabels[1].subline}
          </div>
        </div>
      </div>
    </motion.div>
  )
} 