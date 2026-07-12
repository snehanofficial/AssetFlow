import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  Building2,
  Shield,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSidebar } from './Providers.jsx';
import { useNavigate } from 'react-router-dom';

// ─── Navigation Config ────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        name: 'Assets',
        path: '/assets',
        icon: Package,
        allowedRoles: ['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'],
      },
      {
        name: 'Allocations',
        path: '/allocations',
        icon: Users,
        allowedRoles: ['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'],
      },
      { name: 'Bookings', path: '/bookings', icon: Calendar },
      { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    ],
  },
  {
    label: 'Compliance',
    items: [
      {
        name: 'Audits',
        path: '/audits',
        icon: ClipboardCheck,
        allowedRoles: ['ADMIN', 'ASSET_MANAGER'],
      },
      {
        name: 'Reports',
        path: '/reports',
        icon: BarChart3,
        allowedRoles: ['ADMIN', 'ASSET_MANAGER'],
      },
    ],
  },
];

const ADMIN_ITEMS = [
  { name: 'Organization', path: '/organization', icon: Building2 },
  { name: 'Admin Setup', path: '/admin/org-setup', icon: Shield, adminOnly: true },
  { name: 'Activity Logs', path: '/admin/audit-logs', icon: ScrollText, adminOnly: true },
];

// ─── Helper: User initials ────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const ROLE_LABELS = {
  ADMIN: { label: 'Admin', className: 'bg-[hsl(var(--danger)/0.15)] text-[hsl(var(--danger))]' },
  ASSET_MANAGER: {
    label: 'Asset Manager',
    className: 'bg-[hsl(var(--info)/0.15)] text-[hsl(var(--info))]',
  },
  DEPT_HEAD: {
    label: 'Dept Head',
    className: 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]',
  },
  EMPLOYEE: {
    label: 'Employee',
    className: 'bg-[hsl(var(--surface-hover))] text-[hsl(var(--text-muted))]',
  },
};

// ─── Nav Item ─────────────────────────────────────────────────────────────────
const NavItem = ({ item, isActive, isCollapsed, onClick }) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={isCollapsed ? item.name : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={`
        group relative flex items-center gap-3
        rounded-lg px-3 py-2
        text-sm font-medium
        transition-all duration-100 ease-out
        outline-none
        focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-1 focus-visible:ring-offset-[hsl(var(--sidebar-bg))]
        ${isCollapsed ? 'justify-center px-0 w-10 mx-auto' : ''}
        ${
          isActive
            ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--sidebar-text-active))]'
            : 'text-[hsl(var(--sidebar-text))] hover:bg-[hsl(var(--surface-hover)/0.60)] hover:text-[hsl(var(--text-primary))]'
        }
      `}
    >
      {/* Active indicator bar */}
      {isActive && !isCollapsed && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[hsl(var(--primary))] rounded-full"
          aria-hidden="true"
        />
      )}

      <Icon
        className={`
          flex-shrink-0 transition-colors duration-100
          ${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'}
          ${
            isActive
              ? 'text-[hsl(var(--primary))]'
              : 'text-[hsl(var(--sidebar-text))] group-hover:text-[hsl(var(--text-primary))]'
          }
        `}
        strokeWidth={isActive ? 2 : 1.75}
        aria-hidden="true"
      />

      {!isCollapsed && <span className="truncate">{item.name}</span>}

      {/* Tooltip on collapsed */}
      {isCollapsed && (
        <span
          className="
            absolute left-full ml-3 z-50
            px-2.5 py-1.5
            bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--border))]
            text-xs font-medium text-[hsl(var(--text-primary))]
            rounded-lg shadow-lg
            whitespace-nowrap
            pointer-events-none
            opacity-0 invisible
            group-hover:opacity-100 group-hover:visible
            transition-all duration-100
            -translate-x-1 group-hover:translate-x-0
          "
        >
          {item.name}
        </span>
      )}
    </Link>
  );
};

// ─── Nav Section ──────────────────────────────────────────────────────────────
const NavSection = ({ section, location, isCollapsed, onItemClick }) => {
  return (
    <div className="space-y-0.5">
      {!isCollapsed && (
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted)/0.70)]">
          {section.label}
        </p>
      )}
      {section.items.map((item) => (
        <NavItem
          key={item.path}
          item={item}
          isActive={
            location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          }
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
};

// ─── Sidebar Content ──────────────────────────────────────────────────────────
const SidebarContent = ({ isCollapsed, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleCollapsed } = useSidebar();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filter nav items by user role
  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.allowedRoles || item.allowedRoles.includes(user?.role)
    ),
  })).filter((section) => section.items.length > 0);

  const visibleAdminItems = ADMIN_ITEMS.filter((item) => !item.adminOnly || user?.role === 'ADMIN');

  const roleConfig = ROLE_LABELS[user?.role] || ROLE_LABELS.EMPLOYEE;

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))]">
      {/* ── Brand header ── */}
      <div
        className={`
          h-14 flex items-center border-b border-[hsl(var(--sidebar-border))] flex-shrink-0
          ${isCollapsed ? 'justify-center px-3' : 'px-5 gap-3'}
        `}
      >
        {/* Logo mark */}
        <div
          className="
            w-7 h-7 rounded-lg flex-shrink-0
            bg-[hsl(var(--primary))] flex items-center justify-center
            font-display font-bold text-[hsl(var(--primary-foreground))] text-sm
            shadow-sm
          "
          aria-hidden="true"
        >
          A
        </div>
        {!isCollapsed && (
          <span className="font-display font-bold text-base tracking-tight text-[hsl(var(--text-primary))]">
            AssetFlow
          </span>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5" aria-label="Main Navigation">
        {visibleSections.map((section) => (
          <NavSection
            key={section.label}
            section={section}
            location={location}
            isCollapsed={isCollapsed}
            onItemClick={onClose}
          />
        ))}

        {/* Admin / Organization section */}
        {visibleAdminItems.length > 0 && (
          <div className="space-y-0.5">
            {!isCollapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted)/0.70)]">
                Administration
              </p>
            )}
            {visibleAdminItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={location.pathname === item.path}
                isCollapsed={isCollapsed}
                onClick={onClose}
              />
            ))}
          </div>
        )}
      </nav>

      {/* ── User footer ── */}
      <div
        className={`
          flex-shrink-0 border-t border-[hsl(var(--sidebar-border))]
          ${isCollapsed ? 'p-2' : 'p-3'}
        `}
      >
        {isCollapsed ? (
          /* Collapsed: just avatar */
          <button
            title={user?.name || 'User'}
            onClick={handleLogout}
            className="
              w-10 h-10 mx-auto flex items-center justify-center rounded-lg
              bg-[hsl(var(--primary)/0.10)] text-[hsl(var(--primary))]
              text-xs font-bold
              hover:bg-[hsl(var(--primary)/0.20)] transition-colors duration-100
              cursor-pointer
            "
            aria-label={`Signed in as ${user?.name}. Click to sign out.`}
          >
            {getInitials(user?.name)}
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div
              className="
                w-8 h-8 rounded-lg flex-shrink-0
                bg-[hsl(var(--primary)/0.10)] text-[hsl(var(--primary))]
                flex items-center justify-center
                text-xs font-bold
              "
              aria-hidden="true"
            >
              {getInitials(user?.name)}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[hsl(var(--text-primary))] truncate">
                {user?.name || 'User'}
              </p>
              <span
                className={`inline-block mt-0.5 px-1.5 py-0 text-[10px] font-semibold rounded ${roleConfig.className}`}
              >
                {roleConfig.label}
              </span>
            </div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="
                w-7 h-7 rounded flex items-center justify-center flex-shrink-0
                text-[hsl(var(--text-muted))] hover:text-[hsl(var(--danger))]
                hover:bg-[hsl(var(--danger)/0.08)]
                transition-colors duration-100 cursor-pointer
              "
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapsed}
          className={`
            mt-2 w-full flex items-center justify-center
            h-7 rounded text-xs text-[hsl(var(--text-muted))]
            hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover)/0.50)]
            transition-colors duration-100 cursor-pointer
            hidden lg:flex
          `}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Main Sidebar Export ──────────────────────────────────────────────────────
export const Sidebar = () => {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* ── Desktop Sidebar (lg+) ── */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0
          h-screen sticky top-0
          transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          overflow-hidden
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
        aria-label="Sidebar"
      >
        <SidebarContent isCollapsed={isCollapsed} />
      </aside>

      {/* ── Mobile Drawer ── */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden overlay-backdrop"
            onClick={closeMobile}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <aside
            className="
              fixed left-0 top-0 bottom-0 z-50
              w-72 flex flex-col
              lg:hidden
              animate-[slide-in-left_300ms_cubic-bezier(0.16,1,0.3,1)_both]
            "
            aria-label="Navigation menu"
            aria-modal="true"
          >
            <SidebarContent isCollapsed={false} onClose={closeMobile} />
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
