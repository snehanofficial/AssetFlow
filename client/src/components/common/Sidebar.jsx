import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Calendar,
  UserCheck,
  Wrench,
  ShieldCheck,
  BarChart3,
  Settings,
  Bell,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Assets', path: '/assets', icon: Package },
  { name: 'Allocations', path: '/allocations', icon: UserCheck },
  { name: 'Bookings', path: '/bookings', icon: Calendar },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench },
  { name: 'Audits', path: '/audits', icon: ShieldCheck },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Organization', path: '/organization', icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const visibleNavigation = [...navigationItems];
  if (user?.role === 'ADMIN') {
    visibleNavigation.push({ name: 'Admin Setup', path: '/admin/org-setup', icon: Shield });
  }

  // Helper to extract initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      {/* Brand logo header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2">
        <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-display font-bold text-white text-lg">
          A
        </div>
        <span className="font-display font-bold text-lg tracking-tight text-white">AssetFlow</span>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User info */}
      <div className="p-4 border-t border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-900 flex items-center justify-center text-sm font-bold">
          {getInitials(user?.name)}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white truncate" title={user?.name || 'User'}>
            {user?.name || 'User'}
          </span>
          <span
            className="text-xs text-slate-500 truncate"
            title={user?.email || 'user@assetflow.com'}
          >
            {user?.email || 'user@assetflow.com'}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
