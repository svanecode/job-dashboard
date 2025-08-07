'use client'

import { MapPin, Calendar, Building2, MessageSquare, Bookmark, Trash2 } from 'lucide-react'
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
  commentCount?: number
  isSaved?: boolean
  isSaving?: boolean
  onOpen: () => void
  onSave?: () => void
}

export default function CardRow({ 
  title, 
  company, 
  location, 
  date, 
  score, 
  excerpt, 
  commentCount = 0,
  isSaved = false,
  isSaving = false,
  onOpen,
  onSave
}: CardRowProps) {
  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSave?.()
  }

  return (
    <div
      onClick={onOpen}
      className="w-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm p-4 text-left overflow-hidden tap-highlight-none active:scale-[0.99] transition-all duration-200 shadow-md hover:shadow-lg hover:border-white/30 select-none cursor-pointer max-w-full"
      style={{ maxWidth: '100%', width: '100%' }}
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

      {/* Meta line: Location + Date + Comments + Save */}
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

        {/* Comments */}
        <div className="flex items-center gap-1.5">
          <MessageSquare className="size-4 opacity-70" />
          <span className="text-xs font-medium">{commentCount}</span>
        </div>

        {/* Save/Unsave button */}
        {onSave && (
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              isSaving
                ? 'text-slate-500 cursor-not-allowed'
                : isSaved
                ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                : 'text-slate-400 hover:text-slate-300 hover:bg-white/10'
            }`}
            title={isSaved ? 'Fjern fra gemte' : 'Gem job'}
          >
            {isSaving ? (
              <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isSaved ? (
              <Trash2 className="size-4" />
            ) : (
              <Bookmark className="size-4" />
            )}
          </button>
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