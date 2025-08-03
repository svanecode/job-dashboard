interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ScoreBadge({ score, size = 'md', className = '' }: ScoreBadgeProps) {
  const scoreConfig = {
    3: { label: 'Akut', className: 'bg-red-600 text-white' },
    2: { label: 'Relevant', className: 'bg-blue-600 text-white' },
    1: { label: 'Lav', className: 'bg-gray-600 text-white' }
  }
  
  const config = scoreConfig[score as keyof typeof scoreConfig] || scoreConfig[1]
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }
  
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClasses[size]} ${className}`}>
      {config.label}
    </span>
  )
} 