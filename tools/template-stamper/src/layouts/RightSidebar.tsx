import React from 'react';
import { Card } from '../components/ui';

export interface RightSidebarProps {
  children?: React.ReactNode;
  visible?: boolean;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  children,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <aside className="w-80 bg-bg-primary border-l border-border-subtle p-4 overflow-y-auto">
      {children || (
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Information
          </h3>
          <p className="text-xs text-text-secondary">
            Additional information and context will appear here.
          </p>
        </Card>
      )}
    </aside>
  );
};
