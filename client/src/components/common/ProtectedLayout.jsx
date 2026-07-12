import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const ProtectedLayout = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xs font-medium">Checking authorization status...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-lg text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-950/40 text-rose-500 border border-rose-900/40 flex items-center justify-center font-bold text-lg">
          !
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-slate-400 text-sm max-w-md">
          Your account role does not have sufficient privileges to access this configuration module.
          Contact your administrator if you need access.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedLayout;
