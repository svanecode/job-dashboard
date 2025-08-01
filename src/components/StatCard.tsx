'use client'

import { motion } from 'framer-motion'
import { Flame, Bolt, Layers, TrendingUp, Briefcase } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  tone: 'success' | 'warn' | 'muted' | 'info'
  icon: 'flame' | 'bolt' | 'stack' | 'trending' | 'briefcase'
}

const iconMap = {
  flame: Flame,
  bolt: Bolt,
  stack: Layers,
  trending: TrendingUp,
  briefcase: Briefcase,
}

const toneStyles = {
  success: 'ring-emerald-400/20 shadow-emerald-400/5',
  warn: 'ring-amber-400/20 shadow-amber-400/5',
  muted: 'ring-slate-400/20 shadow-slate-400/5',
  info: 'ring-blue-400/20 shadow-blue-400/5',
}

export default function StatCard({ title, value, tone, icon }: StatCardProps) {
  const IconComponent = iconMap[icon]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`card p-5 flex items-center gap-4 ${toneStyles[tone]}`}
    >
      <div className="size-10 rounded-xl bg-white/5 ring-1 ring-white/10 grid place-items-center">
        <IconComponent className="size-5 text-slate-300" />
      </div>
      <div className="flex-1">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="font-heading font-semibold text-2xl tracking-tight text-white">
          {value.toLocaleString()}
        </p>
      </div>
    </motion.div>
  )
} 