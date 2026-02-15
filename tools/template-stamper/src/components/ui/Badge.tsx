import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-bg-tertiary text-text-secondary border border-border-subtle',
    success: 'bg-status-online/10 text-status-online border border-status-online/20',
    warning: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
    error: 'bg-accent-red/10 text-accent-red border border-accent-red/20',
    info: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-md
        ${variantStyles[variant]} ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
