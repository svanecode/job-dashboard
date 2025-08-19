'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { SortConfig, SortKey } from '@/utils/sort'

interface SortDropdownProps {
  sort: SortConfig
  onSortChange: (sort: SortConfig) => void
}

const sortOptions = [
  { key: 'score', label: 'Score' },
  { key: 'company', label: 'Firma' },
  { key: 'title', label: 'Titel' },
  { key: 'location', label: 'Lokation' },
  { key: 'date', label: 'Dato' },
  { key: 'comments', label: 'Kommentarer' },
  { key: 'saved', label: 'Gemte' }
] as const

export default function SortDropdown({ sort, onSortChange }: SortDropdownProps) {
  const handleKeyChange = (key: SortKey) => {
    onSortChange({ key, dir: sort.dir })
  }

  const handleDirectionChange = (dir: 'asc' | 'desc') => {
    onSortChange({ key: sort.key, dir })
  }

  const getDirectionIcon = () => {
    if (sort.dir === 'asc') return <ChevronUp className="size-4" />
    if (sort.dir === 'desc') return <ChevronDown className="size-4" />
    return <ChevronDown className="size-4" />
  }

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.key === sort.key)
    return option?.label || 'Vælg sortering'
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sort Key Dropdown */}
      <div className="relative">
        <select
          value={sort.key}
          onChange={(e) => handleKeyChange(e.target.value as SortKey)}
          className="appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-kpmg-500 focus:border-transparent cursor-pointer hover:bg-white/10 transition-colors"
        >
          {sortOptions.map((option) => (
            <option key={option.key} value={option.key} className="bg-ink text-white">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
      </div>

      {/* Sort Direction Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleDirectionChange('asc')}
          className={`p-2 rounded-lg transition-colors ${
            sort.dir === 'asc'
              ? 'bg-kpmg-500 text-white'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="Stigende (A-Z, 1-9)"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          onClick={() => handleDirectionChange('desc')}
          className={`p-2 rounded-lg transition-colors ${
            sort.dir === 'desc'
              ? 'bg-kpmg-500 text-white'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
          title="Faldende (Z-A, 9-1)"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>
    </div>
  )
} 