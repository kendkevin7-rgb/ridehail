import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'glass' | 'solid';
}

export function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'md',
  variant = 'glass',
}: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-7',
  };

  const variantClasses = {
    glass: 'glass rounded-3xl',
    solid: 'bg-white rounded-3xl shadow-soft border border-surface-100',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        variantClasses[variant],
        paddingClasses[padding],
        'transition-all duration-200',
        hoverable && 'hover:-translate-y-0.5 hover:shadow-glass-lg cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
