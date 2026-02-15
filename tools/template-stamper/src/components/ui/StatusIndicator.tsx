import React from 'react';

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'queued' | 'preprocessing' | 'rendering' | 'completed' | 'failed';
  label?: string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showDot = true,
  size = 'md',
  className = '',
}) => {
  const statusColors = {
    online: 'bg-status-online',
    offline: 'bg-status-offline',
    warning: 'bg-status-warning',
    queued: 'bg-yellow-500',
    preprocessing: 'bg-blue-500',
    rendering: 'bg-purple-500',
    completed: 'bg-status-online',
    failed: 'bg-accent-red',
  };

  const statusLabels = {
    online: 'Online',
    offline: 'Offline',
    warning: 'Warning',
    queued: 'Queued',
    preprocessing: 'Preprocessing',
    rendering: 'Rendering',
    completed: 'Completed',
    failed: 'Failed',
  };

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showDot && (
        <span className="relative flex">
          <span className={`${dotSizes[size]} ${statusColors[status]} rounded-full`}></span>
          {status === 'online' && (
            <span className={`absolute inline-flex h-full w-full ${statusColors[status]} rounded-full opacity-75 animate-ping`}></span>
          )}
        </span>
      )}
      {label !== undefined && (
        <span className={`${textSizes[size]} text-text-secondary`}>
          {label}
        </span>
      )}
      {label === undefined && (
        <span className={`${textSizes[size]} text-text-secondary`}>
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
};
