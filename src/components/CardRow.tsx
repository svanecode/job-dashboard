'use client'

import { MapPin, Calendar, Building2 } from 'lucide-react'
import DescriptionClamp from './DescriptionClamp'
import ScoreBadge from './ScoreBadge'
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
    <div
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className="w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-4 text-left overflow-hidden tap-highlight-none active:scale-[0.99] transition-all duration-200 shadow-md hover:shadow-lg hover:border-white/30 select-none cursor-pointer max-w-full"
      style={{ maxWidth: '100%', width: '100%' }}
      role="button"
      tabIndex={0}
      aria-label={`Åbn jobopslag: ${title} hos ${company}`}
    >
      {/* Header with company and score badge */}
      <div className="flex items-start justify-between mb-3 min-w-0 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="size-4 text-slate-400" />
          <span className="text-sm text-slate-300 font-medium truncate min-w-0">
            {company || 'Ukendt firma'}
          </span>
        </div>
        
        {/* Score badge */}
        <div className="ml-2">
          <ScoreBadge score={score} size="sm" />
        </div>
      </div>

      {/* Title */}
      <div className="mb-3 min-w-0 w-full">
        <h3 className="text-base font-semibold text-white leading-tight line-clamp-2 break-words">
          {title || 'Ingen titel'}
        </h3>
      </div>

      {/* Meta line: Location + Date */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3 min-w-0 w-full">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <MapPin className="size-4 opacity-70" />
          <span className="truncate min-w-0">
            {location || 'Ukendt lokation'}
          </span>
        </div>
        
        {date && (
          <div className="flex items-center gap-1.5 tabular-nums">
            <Calendar className="size-4 opacity-70" />
            <span className="truncate">{formatDate(date)}</span>
          </div>
        )}
      </div>

      {/* Excerpt */}
      {excerpt && (
        <div className="text-sm text-slate-300 leading-relaxed min-w-0 w-full">
          <DescriptionClamp text={excerpt} lines={2} className="text-slate-300" />
        </div>
      )}
    </div>
  )
} 