import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layout, Video, Briefcase, Images, BookOpen } from 'lucide-react';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-md
        transition-all duration-200
        ${
          isActive
            ? 'bg-accent-red text-text-primary font-medium'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
        }
      `}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
};

export const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: <Home className="w-4 h-4" />, label: 'Home' },
    { to: '/templates', icon: <Layout className="w-4 h-4" />, label: 'Templates' },
    { to: '/assets', icon: <Images className="w-4 h-4" />, label: 'Assets' },
    { to: '/generate', icon: <Video className="w-4 h-4" />, label: 'Generate' },
    { to: '/jobs', icon: <Briefcase className="w-4 h-4" />, label: 'Jobs' },
    { to: '/template-guide', icon: <BookOpen className="w-4 h-4" />, label: 'Template Guide' },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          isActive={location.pathname === item.to}
        />
      ))}
    </nav>
  );
};
