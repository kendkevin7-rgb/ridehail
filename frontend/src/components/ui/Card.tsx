import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: string;
}

export function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'card',
        hoverable && 'hover:shadow-md transition-shadow duration-200 cursor-pointer',
        padding,
        className
      )}
    >
      {children}
    </div>
  );
}
