import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogOut, Search, Bell } from 'lucide-react';
import { useTheme } from './Providers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const GlobalHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Title / Breadcrumbs */}
      <div className="flex items-center gap-2">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
          AssetFlow
        </span>
        <span className="text-slate-800">/</span>
        <span className="text-sm font-semibold text-white">{getPageTitle()}</span>
      </div>

      {/* Global search */}
      <div className="hidden md:flex items-center w-96 max-w-lg bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 gap-2.5">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Global search assets, bookings, tickets..."
          className="bg-transparent border-none outline-none text-slate-300 text-sm placeholder-slate-500 w-full"
        />
      </div>

      {/* Action controls */}
      <div className="flex items-center gap-4">
        {/* Toggle Theme button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications badge */}
        <button className="p-2 rounded-md hover:bg-slate-900 text-slate-400 hover:text-white relative transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
        </button>

        {/* Logout trigger */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 rounded-md transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default GlobalHeader;
