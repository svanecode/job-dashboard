'use client'

import { cn } from '@/lib/utils'

export type JobItem = {
  id: number | string
  job_id?: string
  title: string
  company: string
  location?: string | null
  publication_date?: string | null
  cfo_score?: number | null
  similarity?: number | null
  recommended?: boolean
}

export default function JobCard({ item, onOpen }: { item: JobItem; onOpen?: (item: JobItem) => void }) {
  const date = item.publication_date ? new Date(item.publication_date) : null
  const scoreBadge = typeof item.cfo_score === 'number' ? `${item.cfo_score}/3` : undefined
  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className={cn(
        'group w-full text-left rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-colors',
        'shadow-sm hover:shadow-md px-4 py-3'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white line-clamp-2 flex-1">{item.title}</h3>
            {scoreBadge && (
              <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/90">
                Score {scoreBadge}
              </span>
            )}
            {item.recommended && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-xs">
                Anbefalet
              </span>
            )}
          </div>
          <div className="text-sm text-slate-300">{item.company}</div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {item.location && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                {String(item.location)}
              </span>
            )}
            {date && (
              <time className="text-slate-400">{date.toLocaleDateString('da-DK')}</time>
            )}
          </div>
        </div>
        <div className="self-center">
          <span className="text-xs text-slate-300 group-hover:text-white underline underline-offset-4">Detaljer →</span>
        </div>
      </div>
    </button>
  )
}

export function JobCardGrid({ items, onOpen, initial = 12 }: { items: JobItem[]; onOpen?: (i: JobItem) => void; initial?: number }) {
  const showAllKey = `job_grid_show_all_${items?.[0]?.id ?? 'x'}`
  const showAll = typeof window !== 'undefined' && window.sessionStorage.getItem(showAllKey) === '1'
  const setShowAll = (v: boolean) => {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(showAllKey, v ? '1' : '0')
  }

  const visible = showAll ? items : items.slice(0, initial)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {visible.map((it) => (
          <JobCard key={String(it.id)} item={it} onOpen={onOpen} />
        ))}
      </div>
      {!showAll && items.length > initial && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs text-slate-300 underline underline-offset-4 hover:text-white"
        >
          Vis alle ({items.length})
        </button>
      )}
    </div>
  )
}

