import React from 'react';
import { Navigation } from '../components/Navigation';

export const LeftSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-bg-secondary border-r border-border-subtle p-4">
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
          Navigation
        </h2>
        <Navigation />
      </div>

      {/* Space for additional sidebar content */}
      <div className="mt-8">
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        {/* Placeholder for future quick actions */}
      </div>
    </aside>
  );
};
