import clsx from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'brand' | 'white' | 'surface';
}

export function Spinner({ size = 'md', className, color = 'brand' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-[2.5px]',
    lg: 'h-9 w-9 border-[3px]',
  };

  const colorClasses = {
    brand: 'border-brand-200 border-t-brand-600',
    white: 'border-white/30 border-t-white',
    surface: 'border-surface-200 border-t-surface-600',
  };

  return (
    <div
      role="status"
      className={clsx(
        'animate-spin rounded-full',
        colorClasses[color],
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
