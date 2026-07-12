/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── 1. Theme Provider ────────────────────────────────────────────────────────
const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

// ─── 2. Toast Provider ────────────────────────────────────────────────────────
const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success:
    'bg-[hsl(var(--surface-elevated))] border-[hsl(var(--success)/0.40)] text-[hsl(var(--text-primary))]',
  error:
    'bg-[hsl(var(--surface-elevated))] border-[hsl(var(--danger)/0.40)] text-[hsl(var(--text-primary))]',
  warning:
    'bg-[hsl(var(--surface-elevated))] border-[hsl(var(--warning)/0.40)] text-[hsl(var(--text-primary))]',
  info: 'bg-[hsl(var(--surface-elevated))] border-[hsl(var(--info)/0.40)] text-[hsl(var(--text-primary))]',
};

const TOAST_ICON_STYLES = {
  success: 'text-[hsl(var(--success))]',
  error: 'text-[hsl(var(--danger))]',
  warning: 'text-[hsl(var(--warning))]',
  info: 'text-[hsl(var(--info))]',
};

const ToastItem = ({ toast, onDismiss }) => {
  const Icon = TOAST_ICONS[toast.type] || Info;

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={`
        flex items-start gap-3
        w-80 max-w-[calc(100vw-2rem)]
        px-4 py-3.5
        rounded-xl border shadow-xl
        text-sm font-medium
        pointer-events-auto
        animate-[slide-up_200ms_cubic-bezier(0.16,1,0.3,1)_both]
        ${TOAST_STYLES[toast.type]}
      `}
    >
      <Icon
        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${TOAST_ICON_STYLES[toast.type]}`}
        aria-hidden="true"
      />
      <span className="flex-1 text-xs leading-relaxed">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="
          flex-shrink-0 -mr-1 -mt-0.5
          w-6 h-6 rounded
          flex items-center justify-center
          text-[hsl(var(--text-muted))]
          hover:text-[hsl(var(--text-primary))]
          hover:bg-[hsl(var(--surface-hover))]
          transition-colors duration-100
          cursor-pointer
        "
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => {
        // Max 3 toasts visible at once
        const next = [...prev, { id, message, type }];
        return next.slice(-3);
      });
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      {/* Toast portal */}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ─── 3. Sidebar State Context ─────────────────────────────────────────────────
const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, toggleCollapsed, isMobileOpen, openMobile, closeMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

// ─── 4. Auth + Query Client ───────────────────────────────────────────────────
import { AuthProvider } from '../../context/AuthContext.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000, // 30s default stale time
    },
  },
});

// ─── 5. Combined Providers ────────────────────────────────────────────────────
export const Providers = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SidebarProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </SidebarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default Providers;
