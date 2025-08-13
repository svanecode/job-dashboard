'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
import FilterSheet from './FilterSheet'

export default function FilterPopupButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-kpmg-500 hover:bg-kpmg-700 text-white px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kpmg-500/40"
        aria-label="Åbn filtre"
      >
        <Filter className="size-4" />
        Filtre
      </button>

      <FilterSheet open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

