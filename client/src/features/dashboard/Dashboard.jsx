import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Package,
  UserCheck,
  Wrench,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../context/AuthContext.jsx';
import apiFetch from '../../utils/api.js';
import QuickActions from './components/QuickActions.jsx';
import { SkeletonDashboard } from '../../components/ui/Skeleton.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { AssetStatusBadge } from '../../components/ui/Badge.jsx';

// ─── Recharts custom tooltip ──────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-elevated px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-[hsl(var(--text-primary))] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full bg-current flex-shrink-0" aria-hidden="true" />
          {p.name}: <span className="font-semibold ml-auto pl-3">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, colorClass, description, onClick }) => (
  <button
    onClick={onClick}
    className={`
      card p-5 flex items-center justify-between
      text-left w-full
      transition-all duration-150
      ${onClick ? 'cursor-pointer hover:border-[hsl(var(--ring)/0.40)] hover:shadow-md' : 'cursor-default'}
      group
    `}
    aria-label={`${label}: ${value}`}
  >
    <div className="space-y-1.5 min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(var(--text-muted))]">
        {label}
      </p>
      <p className="font-display text-3xl font-bold text-[hsl(var(--text-primary))] tabular-nums leading-none">
        {value ?? '—'}
      </p>
      {description && (
        <p className="text-[11px] text-[hsl(var(--text-secondary))]">{description}</p>
      )}
    </div>
    <div
      className={`
        rounded-xl border p-3 flex-shrink-0 ml-4
        transition-transform duration-150
        ${onClick ? 'group-hover:scale-110' : ''}
        ${colorClass}
      `}
      aria-hidden="true"
    >
      <Icon className="w-5 h-5" />
    </div>
  </button>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
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
    refetchInterval: 15_000,
    staleTime: 0,
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

  // Build trend chart data from available/allocated
  const trendData = [
    { label: 'Available', value: metrics.available ?? 0 },
    { label: 'Allocated', value: metrics.allocated ?? 0 },
    { label: 'Bookings', value: metrics.activeBookings ?? 0 },
    { label: 'Repairs', value: metrics.maintenanceToday ?? 0 },
  ];

  const statCards = [
    {
      label: 'Available Assets',
      value: metrics.available,
      icon: Package,
      colorClass:
        'text-[hsl(var(--info))] bg-[hsl(var(--info)/0.10)] border-[hsl(var(--info)/0.20)]',
      description: 'Ready for allocation',
      onClick: () => navigate('/assets?status=AVAILABLE'),
    },
    {
      label: 'Active Allocations',
      value: metrics.allocated,
      icon: UserCheck,
      colorClass:
        'text-[hsl(var(--success))] bg-[hsl(var(--success)/0.10)] border-[hsl(var(--success)/0.20)]',
      description: 'Currently checked out',
      onClick: () => navigate('/allocations'),
    },
    {
      label: 'Scheduled Bookings',
      value: metrics.activeBookings,
      icon: Calendar,
      colorClass:
        'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.10)] border-[hsl(var(--primary)/0.20)]',
      description: 'Active reservations',
      onClick: () => navigate('/bookings'),
    },
    {
      label: 'Open Repairs',
      value: metrics.maintenanceToday,
      icon: Wrench,
      colorClass:
        'text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.10)] border-[hsl(var(--warning)/0.20)]',
      description: 'Pending maintenance',
      onClick: () => navigate('/maintenance'),
    },
  ];

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) return <SkeletonDashboard />;

  if (error) {
    return (
      <div className="max-w-lg">
        <Alert variant="danger" title="Failed to load dashboard metrics">
          {error.message || 'Server connection error. Please refresh the page.'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
          System Overview
        </h1>
        <p className="text-xs text-[hsl(var(--text-secondary))]">
          Live asset metrics, allocation activities, and maintenance status.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Allocation Trends Chart — 2 cols */}
        <div className="card p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--text-primary))]">
                <TrendingUp
                  className="w-4 h-4 text-[hsl(var(--text-secondary))]"
                  aria-hidden="true"
                />
                Asset Distribution
              </h2>
              <p className="text-[11px] text-[hsl(var(--text-muted))]">
                Current status snapshot across all tracked assets
              </p>
            </div>
          </div>

          <div className="h-56" aria-label="Asset distribution chart">
            {trendData.every((d) => d.value === 0) ? (
              <div className="h-full flex items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--text-muted))]">No data available yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(263 70% 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(263 70% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(220 14% 18%)"
                    vertical={false}
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(215 16% 38%)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(215 16% 38%)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(263 70% 60%)"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                    name="Count"
                    activeDot={{ r: 5, strokeWidth: 0, fill: 'hsl(263 70% 60%)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <QuickActions />

          {/* Overdue Returns */}
          <div className="card p-5 space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--text-primary))]">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--danger))]" aria-hidden="true" />
              Overdue Returns
              {overdueItems.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.10)] border border-[hsl(var(--danger)/0.20)] rounded px-1.5 py-0.5">
                  {overdueItems.length}
                </span>
              )}
            </h3>

            {!isManager ? (
              <div className="flex items-center justify-center h-36 rounded-lg border border-dashed border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--text-muted))] text-center px-4">
                  Items assigned to you that are overdue will appear here.
                </p>
              </div>
            ) : overdueItems.length === 0 ? (
              <div className="flex items-center justify-center h-36 rounded-lg border border-dashed border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--success))] font-medium">
                  ✓ All clear — no overdue returns
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {overdueItems.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate('/allocations')}
                    className="
                      w-full text-left flex items-center justify-between gap-2
                      rounded-lg border border-[hsl(var(--border))]
                      bg-[hsl(var(--surface-subtle))] p-3
                      hover:border-[hsl(var(--danger)/0.30)] hover:bg-[hsl(var(--danger)/0.04)]
                      transition-all duration-150 cursor-pointer
                      group
                    "
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[hsl(var(--text-primary))] truncate">
                        {item.asset?.name || '—'}
                      </p>
                      <p className="text-[10px] text-[hsl(var(--text-muted))] truncate mt-0.5">
                        {item.employee ? item.employee.name : 'Unknown holder'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.08)] border border-[hsl(var(--danger)/0.20)] rounded px-1.5 py-0.5 whitespace-nowrap">
                        Due {formatDate(item.expectedReturnAt)}
                      </span>
                      <ArrowRight
                        className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isManager && overdueItems.length > 6 && (
              <button
                onClick={() => navigate('/allocations')}
                className="flex items-center justify-end gap-1 w-full text-xs font-medium text-[hsl(var(--primary))] hover:underline cursor-pointer pt-1"
              >
                View all {overdueItems.length} overdue
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
