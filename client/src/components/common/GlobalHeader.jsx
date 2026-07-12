import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, Menu, Search } from 'lucide-react';
import { useTheme, useSidebar } from './Providers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../utils/api.js';

// ─── Path label map ───────────────────────────────────────────────────────────
const PATH_LABELS = {
  '/dashboard': 'Dashboard',
  '/assets': 'Asset Directory',
  '/allocations': 'Allocations',
  '/bookings': 'Bookings',
  '/maintenance': 'Maintenance',
  '/audits': 'Audits',
  '/reports': 'Reports & Analytics',
  '/notifications': 'Notifications',
  '/organization': 'Organization',
  '/admin/org-setup': 'Admin Setup',
  '/admin/audit-logs': 'Activity Logs',
};

const getPageTitle = (pathname) => {
  // Exact match first
  if (PATH_LABELS[pathname]) return PATH_LABELS[pathname];
  // Prefix match
  const match = Object.keys(PATH_LABELS).find((key) => pathname.startsWith(key) && key !== '/');
  return match ? PATH_LABELS[match] : 'AssetFlow';
};

// ─── GlobalHeader ─────────────────────────────────────────────────────────────
export const GlobalHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const { openMobile } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch unread notification count
  const { data: notificationsResponse } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiFetch('/notifications'),
    enabled: !!user,
    refetchInterval: 20_000,
    staleTime: 0,
  });

  const unreadCount = notificationsResponse?.data?.unreadCount ?? 0;
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header
      className="
        h-14 flex-shrink-0 z-30 sticky top-0
        flex items-center justify-between
        px-4 md:px-6
        bg-[hsl(var(--surface))]
        border-b border-[hsl(var(--border))]
      "
      role="banner"
    >
      {/* ── Left: Hamburger (mobile) + Breadcrumb ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={openMobile}
          className="
            lg:hidden
            w-8 h-8 flex items-center justify-center rounded-lg
            text-[hsl(var(--text-secondary))]
            hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))]
            transition-colors duration-100 cursor-pointer flex-shrink-0
          "
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0" aria-label="Breadcrumb">
          <span className="hidden sm:block text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))]">
            AssetFlow
          </span>
          <span className="hidden sm:block text-[hsl(var(--border))] text-xs">/</span>
          <span className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate">
            {pageTitle}
          </span>
        </div>
      </div>

      {/* ── Center: Global Search (desktop) ── */}
      <div className="hidden md:flex flex-1 max-w-sm mx-6">
        <div
          className="
            flex items-center gap-2 w-full
            bg-[hsl(var(--background))] border border-[hsl(var(--border))]
            rounded-lg px-3 py-1.5
            text-xs text-[hsl(var(--text-muted))]
            cursor-text
            hover:border-[hsl(var(--ring)/0.50)] transition-colors duration-100
          "
          role="search"
          aria-label="Global search"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1 text-[hsl(var(--text-muted))]">Search assets, bookings...</span>
          <kbd className="text-[10px] font-mono text-[hsl(var(--text-muted))] bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded px-1.5 py-0.5 leading-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="
            w-8 h-8 flex items-center justify-center rounded-lg
            text-[hsl(var(--text-secondary))]
            hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))]
            transition-colors duration-100 cursor-pointer
          "
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Moon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="
            relative w-8 h-8 flex items-center justify-center rounded-lg
            text-[hsl(var(--text-secondary))]
            hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))]
            transition-colors duration-100 cursor-pointer
          "
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          title="Notifications"
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="
                absolute -top-0.5 -right-0.5
                min-w-[16px] h-4 px-1
                flex items-center justify-center
                rounded-full
                bg-[hsl(var(--danger))]
                text-[hsl(var(--danger-foreground))]
                text-[9px] font-bold leading-none
                shadow-sm
              "
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default GlobalHeader;
