'use client'

import { MapPin, Calendar } from 'lucide-react'
import ScoreBars from './ScoreBars'
import DescriptionClamp from './DescriptionClamp'
import { formatDate } from '@/utils/format'

interface CardRowProps {
  title: string
  company: string
  location: string
  date: string
  score: number
  excerpt: string
  onOpen: () => void
}

export default function CardRow({ 
  title, 
  company, 
  location, 
  date, 
  score, 
  excerpt, 
  onOpen 
}: CardRowProps) {
  return (
    <button
      onClick={onOpen}
      className="w-full card-mobile p-3 text-left overflow-hidden tap-highlight-none active:scale-[0.99] transition shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:border-white/15 select-none"
      role="button"
      aria-label={`Åbn jobopslag: ${title} hos ${company}`}
    >
      {/* Company */}
      <div className="text-[13px] text-slate-300 leading-none">
        {company || 'Ukendt firma'}
      </div>

      {/* Title */}
      <div className="mt-0.5 text-[15px] font-medium text-white leading-snug line-clamp-2 break-words">
        {title || 'Ingen titel'}
      </div>

      {/* Meta line: Location + Date + Score */}
      <div className="mt-1 flex items-center gap-x-2 gap-y-1 text-[13px] text-slate-400 leading-none">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5 align-middle opacity-80" />
          {location || 'Ukendt lokation'}
        </span>
        {date && <span>•</span>}
        <span className="inline-flex items-center gap-1 tabnums">
          <Calendar className="size-3.5 align-middle opacity-80" />
          {formatDate(date)}
        </span>
        {/* Score in right side */}
        <span className="ml-auto">
          <ScoreBars level={score as 1 | 2 | 3} size="sm" className="translate-y-[1px] md:translate-y-0" />
        </span>
      </div>

      {/* Excerpt */}
      {excerpt && (
        <DescriptionClamp text={excerpt} lines={3} className="mt-2" />
      )}
    </button>
  )
} 