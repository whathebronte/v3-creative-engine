import React from 'react';

export interface MainContentProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  return (
    <main className="flex-1 overflow-y-auto bg-bg-primary">
      {/* Page Header */}
      {(title || actions) && (
        <div className="bg-bg-secondary border-b border-border-subtle px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-text-primary mb-1">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-text-secondary">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="p-8">
        {children}
      </div>
    </main>
  );
};
