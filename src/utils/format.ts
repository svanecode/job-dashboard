export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '—'
  
  try {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  } catch {
    return '—'
  }
}

export const truncateText = (text: string | null, maxLength: number = 100): string => {
  if (!text) return '—'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

export const getDaysAgo = (dateString: string | null): number => {
  if (!dateString) return 0
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return 0
  }
}

export const getScoreLabel = (score: number | null): string => {
  if (score === null) return 'Ikke scoret'
  
  switch (score) {
    case 3:
      return 'Akut behov'
    case 2:
      return 'Høj prioritet'
    case 1:
      return 'Medium prioritet'
    case 0:
      return 'Lav prioritet'
    default:
      return 'Ukendt'
  }
} 