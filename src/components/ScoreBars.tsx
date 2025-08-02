'use client'

interface ScoreBarsProps {
  level: 1 | 2 | 3
  size?: 'sm' | 'md'
  className?: string
}

export default function ScoreBars({ level, size = 'md', className = '' }: ScoreBarsProps) {
  const sizeClasses = {
    sm: 'w-12 h-[5px]',
    md: 'w-14 h-[6px]'
  }

  const getSegmentColors = (level: number) => {
    switch (level) {
      case 3:
        return ['bg-kpmg-900', 'bg-kpmg-700', 'bg-kpmg-500']
      case 2:
        return ['bg-kpmg-700', 'bg-kpmg-500', 'bg-white/10']
      case 1:
        return ['bg-kpmg-500', 'bg-white/10', 'bg-white/10']
      default:
        return ['bg-white/10', 'bg-white/10', 'bg-white/10']
    }
  }

  const segmentColors = getSegmentColors(level)

  return (
    <div
      className={`grid grid-cols-3 gap-[3px] ${sizeClasses[size]} group ${className}`}
      role="progressbar"
      aria-label={`Score ${level} af 3`}
      aria-valuenow={level}
      aria-valuemin={0}
      aria-valuemax={3}
    >
      {segmentColors.map((color, index) => (
        <div
          key={index}
          className={`${color} ring-1 ring-white/10 rounded transition-all duration-300 group-hover:animate-pulse`}
        />
      ))}
    </div>
  )
} 