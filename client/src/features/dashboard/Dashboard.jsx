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
      </div>
    </div>
  );
};

export default Dashboard;
