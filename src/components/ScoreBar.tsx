'use client'

interface ScoreBarProps {
  score: number | null
  className?: string
}

export default function ScoreBar({ score, className = '' }: ScoreBarProps) {
  const getCircles = (score: number | null) => {
    if (score === null || score === 0) {
      return [
        { filled: false, color: 'bg-white/10' },
        { filled: false, color: 'bg-white/10' },
        { filled: false, color: 'bg-white/10' }
      ]
    }

    switch (score) {
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

  const circles = getCircles(score)

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="progressbar"
      aria-label={`Score ${score || 0} af 3`}
      aria-valuenow={score || 0}
      aria-valuemin={0}
      aria-valuemax={3}
    >
      <div className="flex items-center gap-1.5">
        {circles.map((circle, index) => (
          <div 
            key={index}
            className={`
              size-2.5 
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
    </div>
  )
} 