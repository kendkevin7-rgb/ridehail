import { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-up">
      <div className="glass rounded-3xl p-6 mb-6 inline-flex items-center justify-center">
        <div className="text-brand-400 [&>svg]:w-12 [&>svg]:h-12 drop-shadow-lg">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-display font-bold text-surface-900 mb-2">{title}</h3>
      <p className="text-sm text-surface-400 max-w-xs leading-relaxed">{description}</p>
      {action && (
        <div className="mt-6">
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
