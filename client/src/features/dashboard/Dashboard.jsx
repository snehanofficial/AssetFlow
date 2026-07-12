import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../utils/api.js';
import QuickActions from './components/QuickActions.jsx';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const Dashboard = () => {
  // Fetch dashboard metrics
  const { data: metricsResponse, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => apiFetch('/dashboard/metrics'),
    refetchInterval: 15000, // Auto-refetch every 15s to keep KPIs live
  });

  const metrics = metricsResponse?.data || {
    available: 0,
    allocated: 0,
    maintenanceToday: 0,
    activeBookings: 0,
    pendingTransfers: 0,
    overdueReturns: [],
  };

  const statCards = [
    { label: 'Available Assets', value: metrics.available, desc: 'Shared & ready for use' },
    { label: 'Active Allocations', value: metrics.allocated, desc: 'Currently checked out' },
    { label: 'Scheduled Bookings', value: metrics.activeBookings, desc: 'Booked shared resources' },
    { label: 'Open Repairs', value: metrics.maintenanceToday, desc: 'Assets in maintenance' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface/50 w-48 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="card-elevation p-6 h-28 bg-surface/50 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-elevation p-6 lg:col-span-2 h-72 bg-surface/50 rounded-lg"></div>
          <div className="h-72 bg-surface/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-elevation p-8 border-destructive/20 bg-destructive/5 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-destructive mx-auto" />
        <h3 className="font-semibold text-text-primary text-sm">Failed to load dashboard metrics</h3>
        <p className="text-text-secondary text-xs">{error.message || 'Server connection error.'}</p>
      </div>
    );
  }
import { useAuth } from '../../context/AuthContext.jsx';
import { Package, UserCheck, Calendar, Wrench, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch metrics counts
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: () => apiFetch('/dashboard'),
  });

  // Fetch allocations to display real overdue returns (for managers/admins)
  const { data: allocData, isLoading: allocLoading } = useQuery({
    queryKey: ['allocations', { status: 'ACTIVE' }],
    queryFn: () => apiFetch('/allocations?status=ACTIVE&limit=50'),
    enabled: user?.role !== 'EMPLOYEE',
  });

  const stats = metricsData?.data || {
    totalAssets: 0,
    activeAllocations: 0,
    scheduledBookings: 0,
    openRepairs: 0,
  };

  const overdueItems = (allocData?.data?.records ?? []).filter((r) => r.isOverdue);

  const statCards = [
    {
      label: 'Total Assets',
      value: stats.totalAssets,
      icon: Package,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Active Allocations',
      value: stats.activeAllocations,
      icon: UserCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Scheduled Bookings',
      value: stats.scheduledBookings,
      icon: Calendar,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      label: 'Open Repairs',
      value: stats.openRepairs,
      icon: Wrench,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          System Overview
        </h1>
        <p className="text-text-secondary text-xs">
          Live tracking metrics, allocation activities, and maintenance alerts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="card-elevation p-6 flex flex-col gap-1 hover:border-primary/20 transition-all">
            <span className="text-text-muted text-xxs font-semibold uppercase tracking-wider">
              {card.label}
            </span>
            <span className="text-3xl font-bold font-display text-text-primary mt-1">
              {card.value}
            </span>
            <span className="text-text-secondary text-xxs mt-0.5">{card.desc}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Trends (2/3 width) */}
        <div className="card-elevation p-6 lg:col-span-2 space-y-4">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="card-elevation p-6 flex items-center justify-between border border-border/30"
            >
              <div className="space-y-1">
                <span className="text-text-muted text-xs font-semibold uppercase tracking-wider block">
                  {card.label}
                </span>
                {metricsLoading ? (
                  <div className="h-8 w-12 bg-surface animate-pulse rounded mt-1" />
                ) : (
                  <span className="text-2xl font-bold font-display text-text-primary">
                    {card.value}
                  </span>
                )}
              </div>
              <div className={`p-3 rounded-xl border ${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Trends chart placeholder */}
        <div className="card-elevation p-6 lg:col-span-2 space-y-4 border border-border/30">
          <h3 className="font-semibold text-sm text-text-primary">Asset Allocation Trends</h3>
          <div className="h-64 bg-background/50 border border-border/50 rounded-lg flex flex-col items-center justify-center text-text-muted text-xs p-6 text-center space-y-2">
            <span className="font-semibold">Chart Visualization Placeholder</span>
            <span className="text-xxs text-text-muted/70 max-w-sm">
              Utilization analytics and peak booking heatmaps will display here. See Reports section for details.
            </span>
          </div>
        </div>

        {/* Right side widgets (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <QuickActions />

          {/* Overdue Returns Panel */}
          {metrics.overdueReturns && metrics.overdueReturns.length > 0 ? (
            <div className="card-elevation p-6 space-y-4 border-destructive/30 bg-destructive/5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs text-destructive flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span>
                  Overdue Return Warning
                </h3>
                <span className="bg-destructive/10 text-destructive text-xxs font-bold px-2 py-0.5 rounded-full">
                  {metrics.overdueReturns.length} Assets
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {metrics.overdueReturns.map((item) => (
                  <div key={item.id} className="p-3 bg-surface border border-destructive/20 rounded-md space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xxs font-bold text-text-primary bg-background px-1.5 py-0.5 rounded border border-border">
                        {item.asset.assetTag}
                      </span>
                      <span className="text-destructive font-semibold text-xxs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                      </span>
                    </div>
                    <p className="text-text-primary font-medium text-xs">{item.asset.name}</p>
                    <div className="text-xxs text-text-secondary flex flex-col gap-0.5">
                      <span>Expected: {new Date(item.expectedReturnAt).toLocaleDateString()}</span>
                      {item.employee && (
                        <span className="text-text-muted mt-1">
                          Held by: {item.employee.name} ({item.employee.email})
                        </span>
                      )}
        {/* Overdue Returns Feed */}
        <div className="card-elevation p-6 space-y-4 border border-border/30 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400" />
              Overdue Returns
            </h3>

            {user?.role === 'EMPLOYEE' ? (
              <div className="h-48 bg-background/30 border border-border/50 rounded flex items-center justify-center text-text-muted text-xs text-center px-4">
                Please contact your supervisor or department head to query your allocations.
              </div>
            ) : allocLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-12 bg-surface animate-pulse rounded-lg" />
                ))}
              </div>
            ) : overdueItems.length === 0 ? (
              <div className="h-48 bg-background/30 border border-border/50 rounded flex items-center justify-center text-text-muted text-xs">
                No Overdue Items
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {overdueItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/assets?id=${item.assetId}`)}
                    className="flex items-center justify-between p-3 bg-surface/50 border border-border/50 rounded-xl hover:border-rose-500/20 hover:bg-rose-500/5 transition-all cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {item.asset.name}
                      </p>
                      <p className="text-[10px] text-text-secondary truncate mt-0.5">
                        Holder: {item.employee.name}
                      </p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        Due {formatDate(item.expectedReturnAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-elevation p-6 space-y-4">
              <h3 className="font-semibold text-sm text-text-primary">Overdue Returns</h3>
              <div className="h-32 bg-background/50 border border-border/50 rounded-lg flex items-center justify-center text-text-muted text-xs">
                No Overdue Items
              </div>
            </div>
            )}
          </div>

          {user?.role !== 'EMPLOYEE' && overdueItems.length > 5 && (
            <button
              onClick={() => navigate('/allocations?tab=allocations')}
              className="text-primary text-xs font-medium flex items-center gap-1 hover:underline justify-end cursor-pointer pt-2"
            >
              View all allocations <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
