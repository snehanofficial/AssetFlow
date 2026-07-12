import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Package,
  ShieldAlert,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import apiFetch from '../../utils/api.js';
import QuickActions from './components/QuickActions.jsx';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    data: metricsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => apiFetch('/dashboard/metrics'),
    refetchInterval: 15000,
  });

  const metrics = metricsResponse?.data || {
    available: 0,
    allocated: 0,
    maintenanceToday: 0,
    activeBookings: 0,
    pendingTransfers: 0,
    overdueReturns: [],
  };

  const isManager = ['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'].includes(user?.role);
  const overdueItems = Array.isArray(metrics.overdueReturns) ? metrics.overdueReturns : [];

  const statCards = [
    {
      label: 'Available Assets',
      value: metrics.available,
      icon: Package,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      desc: 'Shared and ready for use',
    },
    {
      label: 'Active Allocations',
      value: metrics.allocated,
      icon: UserCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      desc: 'Currently checked out',
    },
    {
      label: 'Scheduled Bookings',
      value: metrics.activeBookings,
      icon: Calendar,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      desc: 'Upcoming or in-progress reservations',
    },
    {
      label: 'Open Repairs',
      value: metrics.maintenanceToday,
      icon: Wrench,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      desc: 'Pending maintenance workload',
    },
  ];

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface/50 w-48 rounded"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="card-elevation h-28 rounded-lg bg-surface/50 p-6"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card-elevation h-72 rounded-lg bg-surface/50 p-6 lg:col-span-2"></div>
          <div className="h-72 rounded-lg bg-surface/50"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-elevation space-y-3 border-destructive/20 bg-destructive/5 p-8 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
        <h3 className="text-sm font-semibold text-text-primary">
          Failed to load dashboard metrics
        </h3>
        <p className="text-xs text-text-secondary">{error.message || 'Server connection error.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          System Overview
        </h1>
        <p className="text-xs text-text-secondary">
          Live tracking metrics, allocation activities, and maintenance alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="card-elevation flex items-center justify-between border border-border/30 p-6"
            >
              <div className="space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {card.label}
                </span>
                <span className="font-display text-2xl font-bold text-text-primary">
                  {card.value}
                </span>
                <span className="block text-[11px] text-text-secondary">{card.desc}</span>
              </div>
              <div className={`rounded-xl border p-3 ${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card-elevation space-y-4 border border-border/30 p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary">Asset Allocation Trends</h3>
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-border/50 bg-background/50 p-6 text-center text-xs text-text-muted">
            <span className="font-semibold">Chart visualization placeholder</span>
            <span className="mt-2 max-w-sm text-[11px] text-text-muted/70">
              Utilization analytics and peak booking heatmaps will surface here as reporting widgets
              land.
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <QuickActions />

          <div className="card-elevation flex flex-col justify-between space-y-4 border border-border/30 p-6">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <AlertTriangle size={16} className="text-rose-400" />
                Overdue Returns
              </h3>

              {!isManager ? (
                <div className="flex h-48 items-center justify-center rounded border border-border/50 bg-background/30 px-4 text-center text-xs text-text-muted">
                  Any overdue items assigned to you will appear here automatically.
                </div>
              ) : overdueItems.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded border border-border/50 bg-background/30 text-xs text-text-muted">
                  No overdue items
                </div>
              ) : (
                <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                  {overdueItems.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate('/allocations')}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-border/50 bg-surface/50 p-3 transition-all hover:border-rose-500/20 hover:bg-rose-500/5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-text-primary">
                          {item.asset?.name}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-text-secondary">
                          {item.employee ? `Holder: ${item.employee.name}` : 'Assigned item'}
                        </p>
                      </div>
                      <div className="ml-2 shrink-0 text-right">
                        <span className="rounded border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-300">
                          Due {formatDate(item.expectedReturnAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isManager && overdueItems.length > 5 && (
              <button
                onClick={() => navigate('/allocations')}
                className="flex cursor-pointer items-center justify-end gap-1 pt-2 text-xs font-medium text-primary hover:underline"
              >
                View all allocations <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
