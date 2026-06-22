import { InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={clsx('relative', fullWidth && 'w-full')}>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          id={inputId}
          className={clsx(
            'input-field peer',
            icon && 'pl-10',
            error && 'border-red-500 focus:ring-red-500',
            props.disabled && 'bg-gray-100 text-gray-500 cursor-not-allowed',
            className
          )}
          placeholder=" "
        />
        <label
          htmlFor={inputId}
          className={clsx(
            'absolute left-4 top-2 text-xs transition-all duration-200 pointer-events-none',
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400',
            'peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-600',
            icon && 'peer-placeholder-shown:left-10 peer-focus:left-10 left-10',
            error && 'peer-focus:text-red-500'
          )}
        >
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
