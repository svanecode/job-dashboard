interface ScoreBadgeProps {
  score: number | null;
  className?: string;
}

export default function ScoreBadge({ score, className = '' }: ScoreBadgeProps) {
  const getScoreColor = (score: number | null) => {
    switch (score) {
      case 3:
        return 'bg-green-100 text-green-800 border-green-200';
      case 2:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 1:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 0:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreText = (score: number | null) => {
    switch (score) {
      case 3:
        return '🔥 Akut';
      case 2:
        return '📈 Høj';
      case 1:
        return '📋 Medium';
      case 0:
        return '❌ Lav';
      default:
        return '❓ Ikke scoret';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getScoreColor(score)} ${className}`}>
      {getScoreText(score)}
    </span>
  );
} 