import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ListItemProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  icon: Icon,
  title,
  subtitle,
  rightContent,
  onClick,
  className = '',
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-md
        border border-border-subtle
        bg-bg-secondary
        ${isClickable ? 'cursor-pointer hover:bg-bg-tertiary hover:border-border-input transition-colors duration-200' : ''}
        ${className}
      `}
    >
      {Icon && (
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5 text-text-secondary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-text-tertiary truncate">
            {subtitle}
          </p>
        )}
      </div>
      {rightContent && (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
};
