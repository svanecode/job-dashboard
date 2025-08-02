'use client'

interface ScoreIndicatorProps {
  level: 1 | 2 | 3
  size?: 'sm' | 'md'
  className?: string
}

export default function ScoreIndicator({ level, size = 'md', className = '' }: ScoreIndicatorProps) {
  const sizeClasses = {
    sm: 'gap-1.5',
    md: 'gap-2'
  }

  const circleSizes = {
    sm: 'size-2',
    md: 'size-2.5'
  }

  const getCircles = (level: number) => {
    switch (level) {
      case 3:
        return [
          { filled: true, color: 'bg-kpmg-500' }, // Venstre - lyseblå
          { filled: true, color: 'bg-kpmg-700' }, // Midter - mørkere
          { filled: true, color: 'bg-kpmg-900' }  // Højre - endnu mørkere
        ]
      case 2:
        return [
          { filled: true, color: 'bg-kpmg-500' }, // Venstre - lyseblå
          { filled: true, color: 'bg-kpmg-700' }, // Midter - mørkere
          { filled: false, color: 'bg-white/10' } // Højre - tom
        ]
      case 1:
        return [
          { filled: true, color: 'bg-kpmg-500' }, // Venstre - lyseblå
          { filled: false, color: 'bg-white/10' }, // Midter - tom
          { filled: false, color: 'bg-white/10' }  // Højre - tom
        ]
      default:
        return [
          { filled: false, color: 'bg-white/10' },
          { filled: false, color: 'bg-white/10' },
          { filled: false, color: 'bg-white/10' }
        ]
    }
  }

  const circles = getCircles(level)

  return (
    <div 
      className={`flex items-center ${sizeClasses[size]} ${className}`}
      aria-label={`Score ${level} af 3`}
      role="img"
    >
      {circles.map((circle, index) => (
        <div 
          key={index}
          className={`
            ${circleSizes[size]} 
            ${circle.color} 
            rounded-full 
            transition-all duration-300 ease-out
            ${circle.filled 
              ? 'shadow-[0_0_8px_rgba(0,0,0,0.3)] ring-1 ring-white/20' 
              : 'ring-1 ring-white/10'
            }
            ${circle.filled && circle.color.includes('kpmg-500') 
              ? 'shadow-[0_0_8px_rgba(0,145,218,0.25)]' 
              : ''
            }
            ${circle.filled && circle.color.includes('kpmg-700') 
              ? 'shadow-[0_0_10px_rgba(0,94,184,0.3)]' 
              : ''
            }
            ${circle.filled && circle.color.includes('kpmg-900') 
              ? 'shadow-[0_0_12px_rgba(0,51,141,0.4)]' 
              : ''
            }
          `}
        />
      ))}
    </div>
  )
} 