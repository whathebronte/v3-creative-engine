import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`
          w-full
          bg-bg-input text-text-primary placeholder-text-tertiary
          border ${error ? 'border-accent-red' : 'border-border-input'}
          rounded-md px-4 py-2
          focus:outline-none focus:ring-2 focus:ring-accent-red focus:border-accent-red
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-accent-red">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
};
