import { InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  prefix?: string;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  className,
  id,
  prefix,
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx('relative', fullWidth && 'w-full')}>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}
        {prefix && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 font-medium z-10 pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          {...props}
          id={inputId}
          className={clsx(
            'input-field',
            icon && 'pl-12',
            prefix && 'pl-10',
            error && 'input-error',
            props.disabled && 'bg-surface-50 text-surface-400 cursor-not-allowed',
            className
          )}
          placeholder=" "
        />
        <label
          htmlFor={inputId}
          className={clsx(
            'absolute left-4 top-2 text-[11px] font-medium transition-all duration-200 pointer-events-none text-surface-500',
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:text-surface-400',
            'peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-brand-600',
            icon && 'peer-placeholder-shown:left-12 peer-focus:left-12 left-12',
            prefix && 'peer-placeholder-shown:left-10 peer-focus:left-10 left-10',
            error && 'peer-focus:text-red-500'
          )}
        >
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-surface-400">{helperText}</p>
      )}
    </div>
  );
}
