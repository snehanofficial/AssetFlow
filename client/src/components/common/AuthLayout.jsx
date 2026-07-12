import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xs font-medium">Checking authorization status...</span>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:grid md:grid-cols-2 text-white">
      {/* Branding Column */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-r border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center font-display font-bold text-white text-lg">
            A
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            AssetFlow
          </span>
        </div>

        <div className="space-y-4">
          <h1 className="font-display text-4xl font-extrabold tracking-tight leading-tight text-white">
            Enterprise Asset & Resource Management.
          </h1>
          <p className="text-slate-400 text-sm max-w-md">
            Digitize your complete physical asset inventory lifecycle, coordinate shared resource
            schedules, and execute audits.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          © 2026 AssetFlow Corp. All rights reserved.
        </div>
      </div>

      {/* Form view Column */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-slate-900/40 border border-slate-800/80 p-8 rounded-lg">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
