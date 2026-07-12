import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Search, Bell } from 'lucide-react';
import { useTheme } from './Providers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../utils/api.js';

export const GlobalHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch unread notification counts (poll every 20 seconds)
  const { data: notificationsResponse } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiFetch('/notifications'),
    enabled: !!user,
    refetchInterval: 20000,
  });

  const unreadCount = notificationsResponse?.data?.unreadCount || 0;

  // Simple path parser for title
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1] || '';
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Title / Breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">
          AssetFlow
        </span>
        <span className="text-border">/</span>
        <span className="text-sm font-semibold text-text-primary">{getPageTitle()}</span>
      </div>

      {/* Global search */}
      <div className="hidden md:flex items-center w-96 max-w-lg bg-background border border-border rounded-md px-3 py-1.5 gap-2">
        <Search className="w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Global search assets, bookings, tickets..."
          className="bg-transparent border-none outline-none text-text-primary text-sm placeholder-text-muted w-full"
        />
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-4">
        {/* Toggle Theme button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications badge */}
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary relative transition-all cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white leading-none shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Logout trigger */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-destructive hover:text-destructive-foreground hover:bg-destructive/10 border border-transparent hover:border-destructive/20 rounded-md transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default GlobalHeader;
