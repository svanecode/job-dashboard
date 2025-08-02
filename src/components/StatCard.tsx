'use client'

import { motion } from 'framer-motion'
import { Flame, TrendingUp, ShoppingBag } from 'lucide-react'
import ScoreBars from './ScoreBars'

interface StatCardProps {
  title: string
  count: number
  level: 1 | 2 | 3
  icon?: 'flame' | 'trend' | 'bag'
}

const iconMap = {
  flame: Flame,
  trend: TrendingUp,
  bag: ShoppingBag,
}

const descriptionMap = {
  3: 'Akut interim-behov',
  2: 'Sandsynligt behov',
  1: 'Lav relevans (junior)'
}

export default function StatCard({ title, count, level, icon = 'bag' }: StatCardProps) {
  const IconComponent = iconMap[icon]

  // Get icon background color based on level
  const getIconBgColor = (level: number) => {
    switch (level) {
      case 3:
        return 'bg-kpmg-900/20 ring-kpmg-500/20'
      case 2:
        return 'bg-kpmg-700/15 ring-kpmg-500/15'
      default:
        return 'bg-white/5 ring-white/10'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
    >
      {/* Subtle radial gradient for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-white/[0.02] via-transparent to-transparent rounded-2xl pointer-events-none" />
      
      <div className="relative">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-3">
            <div className={`grid place-items-center w-10 h-10 rounded-full ${getIconBgColor(level)} transition-all duration-200 group-hover:scale-[1.02]`}>
              <IconComponent className="w-5 h-5 text-slate-300 opacity-80" />
            </div>
            <h3 className="text-xs uppercase tracking-wide text-slate-400 font-medium">{title}</h3>
          </div>
          <ScoreBars level={level} className="transition-all duration-200 group-hover:scale-105" />
        </div>

        {/* Count and Description */}
        <div className="px-4 pb-4 pt-2">
          <p className="text-4xl font-semibold tracking-tight text-white leading-none tabular-nums">
            {count.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {level} – {descriptionMap[level as keyof typeof descriptionMap]}
          </p>
        </div>
      </div>
    </motion.div>
  )
} 