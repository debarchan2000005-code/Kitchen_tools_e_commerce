import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  max?: number;
  showValue?: boolean;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Rating({
  value,
  max = 5,
  showValue = true,
  reviewCount,
  size = 'md',
  className = '',
}: RatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const stars = [...Array(max)].map((_, index) => {
    const filled = index < Math.floor(value);
    const partial = !filled && index < value;
    const percentage = partial ? (value - index) * 100 : 0;

    return (
      <span key={index} className="relative">
        <Star
          className={`${sizeClasses[size]} ${
            filled ? 'text-accent-400 fill-current' : 'text-gray-200'
          }`}
        />
        {partial && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${percentage}%` }}
          >
            <Star className={`${sizeClasses[size]} text-accent-400 fill-current`} />
          </div>
        )}
      </span>
    );
  });

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">{stars}</div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700 ml-1">{value.toFixed(1)}</span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-500 ml-1">({reviewCount})</span>
      )}
    </div>
  );
}
