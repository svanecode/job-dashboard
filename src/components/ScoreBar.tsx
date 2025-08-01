'use client'

interface ScoreBarProps {
  score: number | null
  className?: string
}

export default function ScoreBar({ score, className = '' }: ScoreBarProps) {
  if (score === null) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="grid grid-cols-3 gap-[2px] w-16 h-[6px]">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/6 ring-1 ring-white/10 rounded-full"
            />
          ))}
        </div>
      </div>
    )
  }

  const getSegmentColors = (score: number) => {
    switch (score) {
      case 3:
        return ['bg-kpmg-900', 'bg-kpmg-700', 'bg-kpmg-500']
      case 2:
        return ['bg-kpmg-700', 'bg-kpmg-500', 'bg-white/6']
      case 1:
        return ['bg-kpmg-500', 'bg-white/6', 'bg-white/6']
      case 0:
        return ['bg-white/6', 'bg-white/6', 'bg-white/6']
      default:
        return ['bg-white/6', 'bg-white/6', 'bg-white/6']
    }
  }

  const segmentColors = getSegmentColors(score)

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="progressbar"
      aria-label={`Score ${score} af 3`}
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={3}
    >
      <div className="grid grid-cols-3 gap-[2px] w-16 h-[6px]">
        {segmentColors.map((color, index) => (
          <div
            key={index}
            className={`${color} ring-1 ring-white/10 rounded-full transition-all duration-300`}
          />
        ))}
      </div>
    </div>
  )
} 