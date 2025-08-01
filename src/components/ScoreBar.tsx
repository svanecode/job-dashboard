'use client'

interface ScoreBarProps {
  score: number | null
  className?: string
}

export default function ScoreBar({ score, className = '' }: ScoreBarProps) {
  if (score === null) {
    return (
      <div className={`h-2 rounded-full bg-white/10 ${className}`}>
        <div className="h-full w-full bg-white/5 rounded-full" />
      </div>
    )
  }

  const getBarColors = (score: number) => {
    switch (score) {
      case 3:
        return ['bg-kpmg-900', 'bg-kpmg-700', 'bg-kpmg-500']
      case 2:
        return ['bg-kpmg-700', 'bg-kpmg-500', 'bg-white/5']
      case 1:
        return ['bg-kpmg-500', 'bg-white/5', 'bg-white/5']
      case 0:
        return ['bg-white/5', 'bg-white/5', 'bg-white/5']
      default:
        return ['bg-white/5', 'bg-white/5', 'bg-white/5']
    }
  }

  const barColors = getBarColors(score)

  return (
    <div 
      className={`h-2 rounded-full bg-white/10 grid grid-cols-3 gap-1 ${className}`}
      role="progressbar"
      aria-label={`Score ${score} af 3`}
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={3}
    >
      {barColors.map((color, index) => (
        <div
          key={index}
          className={`h-full rounded-full transition-all duration-300 ${color}`}
        />
      ))}
    </div>
  )
} 