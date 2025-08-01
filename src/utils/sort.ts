import { Job } from '@/types/job'

export type SortKey = 'score' | 'company' | 'title' | 'location' | 'date'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: SortKey
  dir: SortDirection
}

// Comparator functions for stable sorting
const compareScores = (a: number | null, b: number | null): number => {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return a - b
}

const compareStrings = (a: string | null, b: string | null): number => {
  const aStr = (a || '').toLowerCase()
  const bStr = (b || '').toLowerCase()
  return aStr.localeCompare(bStr)
}

const compareDates = (a: string | null, b: string | null): number => {
  const aDate = a ? new Date(a).getTime() : 0
  const bDate = b ? new Date(b).getTime() : 0
  return aDate - bDate
}

// Main sort function with fallback to date for stable sorting
export const sortJobs = (jobs: Job[], sortConfig: SortConfig): Job[] => {
  return [...jobs].sort((a, b) => {
    let comparison = 0

    switch (sortConfig.key) {
      case 'score':
        comparison = compareScores(a.cfo_score, b.cfo_score)
        break
      case 'company':
        comparison = compareStrings(a.company, b.company)
        break
      case 'title':
        comparison = compareStrings(a.title, b.title)
        break
      case 'location':
        comparison = compareStrings(a.location, b.location)
        break
      case 'date':
        comparison = compareDates(a.publication_date, b.publication_date)
        break
      default:
        comparison = 0
    }

    // If primary comparison is equal, use date as secondary sort
    if (comparison === 0 && sortConfig.key !== 'date') {
      comparison = compareDates(a.publication_date, b.publication_date)
    }

    // Apply sort direction
    return sortConfig.dir === 'asc' ? comparison : -comparison
  })
}

// Get aria-sort attribute value with proper TypeScript types
export const getAriaSort = (columnKey: SortKey, currentSort: SortConfig): 'ascending' | 'descending' | 'none' => {
  if (currentSort.key !== columnKey) return 'none'
  return currentSort.dir === 'asc' ? 'ascending' : 'descending'
} 