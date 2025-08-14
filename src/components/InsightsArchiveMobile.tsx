'use client'

import { useState } from 'react'
import Link from 'next/link'

type ArchiveItem = {
  id: string
  week_year: number
  week_number: number
  title: string
  published_at?: string | null
}

export default function InsightsArchiveMobile({ archive, selectedId }: { archive: ArchiveItem[]; selectedId?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setOpen(true)}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
        >
          Åbn arkiv
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[95]">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/10 bg-neutral-900 p-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-base font-medium">Arkiv</h3>
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">Luk</button>
            </div>
            <ul className="space-y-1">
              {archive.map((it) => {
                const isActive = selectedId === it.id
                const week = String(it.week_number).padStart(2, '0')
                const dateStr = it.published_at ? new Date(it.published_at).toLocaleDateString('da-DK') : ''
                return (
                  <li key={it.id}>
                    <Link
                      href={`/insights?id=${it.id}`}
                      className={
                        `block rounded-lg px-3 py-2 border transition-colors ` +
                        (isActive
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white')
                      }
                      onClick={() => setOpen(false)}
                    >
                      <div className="text-xs text-slate-400">Uge {week}, {it.week_year} • {dateStr}</div>
                      <div className="text-sm font-medium truncate">{it.title}</div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

