import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../utils/api.js';
import { useToast } from '../../components/common/Providers.jsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Download,
  RefreshCw,
  BarChart2,
  ShieldAlert,
  PieChart as PieIcon,
  TrendingUp,
  Calendar,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';

// ─── Chart color palette using design tokens (HSL values for Recharts) ──────
const CHART_COLORS = [
  'hsl(263 70% 60%)', // chart-4 (violet/brand)
  'hsl(142 71% 45%)', // chart-2 (green)
  'hsl(38 92% 55%)', // chart-3 (amber)
  'hsl(217 91% 60%)', // chart-1 (blue)
  'hsl(346 77% 60%)', // chart-5 (rose)
  'hsl(215 16% 50%)', // chart-6 (gray)
];

const STATUS_COLORS = {
  AVAILABLE: 'hsl(142 71% 45%)',
  ALLOCATED: 'hsl(217 91% 60%)',
  UNDER_MAINTENANCE: 'hsl(38 92% 55%)',
  LOST: 'hsl(346 77% 60%)',
  RETIRED: 'hsl(215 16% 50%)',
  DISPOSED: 'hsl(215 16% 40%)',
};

// Shared Recharts tooltip style using CSS variables
const tooltipStyle = {
  backgroundColor: 'hsl(222 47% 11%)',
  borderColor: 'hsl(220 14% 18%)',
  borderRadius: '8px',
  border: '1px solid hsl(220 14% 18%)',
};
const tooltipLabelStyle = {
  color: 'hsl(210 20% 98%)',
  fontWeight: 600,
  fontSize: 11,
};
const tooltipItemStyle = {
  color: 'hsl(215 16% 57%)',
  fontSize: 11,
};

// ─── Chart skeleton ───────────────────────────────────────────────────────────
const ChartSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-40" />
    <Skeleton className="h-64 w-full rounded-lg" />
  </div>
);

export const AnalyticsDashboard = () => {
  const { showToast } = useToast();
  const [exportPending, setExportPending] = useState(null);

  const {
    data: analyticsResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => apiFetch('/reports/summary'),
    staleTime: 60_000,
  });

  const data = analyticsResponse?.data || {
    statusDistribution: {},
    categoryUtilization: [],
    maintenanceFrequency: [],
    bookingHeatmap: [],
  };

  const handleDownload = async (type, filename) => {
    setExportPending(type);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/reports/export?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export file creation failed.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`${type.toUpperCase()} registry downloaded successfully.`, 'success');
    } catch (err) {
      showToast(err.message || 'Download failed.', 'error');
    } finally {
      setExportPending(null);
    }
  };

  const statusPieData = Object.keys(data.statusDistribution || {})
    .map((key) => ({
      name: key.replace(/_/g, ' '),
      value: data.statusDistribution[key],
      color: STATUS_COLORS[key] || 'hsl(215 16% 50%)',
    }))
    .filter((item) => item.value > 0);

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading analytics">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-3 w-96" />
        </div>
        <div className="card p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6">
              <ChartSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Reports & Analytics" icon={BarChart2} />
        <Alert variant="danger" title="Failed to load analytics">
          {error.message || 'You may not have permission to view this report.'}
          <button
            onClick={() => refetch()}
            className="mt-1 flex items-center gap-1 text-xs font-medium hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Retry
          </button>
        </Alert>
      </div>
    );
  }

  const exports = [
    {
      key: 'assets',
      title: 'Asset Registry',
      desc: 'All categories, tags, costs, serial numbers, and locations.',
      filename: `assets_registry_${Date.now()}.csv`,
    },
    {
      key: 'bookings',
      title: 'Booking Schedules',
      desc: 'All reservations including requester, start/end dates, and descriptions.',
      filename: `bookings_log_${Date.now()}.csv`,
    },
    {
      key: 'maintenance',
      title: 'Repair Logs',
      desc: 'Maintenance tickets, assigned technicians, and resolution details.',
      filename: `maintenance_tickets_${Date.now()}.csv`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="Reports & Analytics"
        description="Export data, inspect utilization, and evaluate repair costs."
        icon={BarChart2}
      >
        <button
          onClick={() => refetch()}
          className="
            w-8 h-8 flex items-center justify-center rounded-lg
            border border-[hsl(var(--border))]
            text-[hsl(var(--text-secondary))]
            hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))]
            transition-colors duration-100 cursor-pointer
          "
          aria-label="Refresh analytics"
          title="Refresh"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </button>
      </PageHeader>

      {/* ── Exports Panel ── */}
      <div className="card p-6 space-y-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--text-primary))] border-b border-[hsl(var(--border))] pb-3">
          <Download className="w-4 h-4 text-[hsl(var(--text-secondary))]" aria-hidden="true" />
          Raw Spreadsheet Exports
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {exports.map(({ key, title, desc, filename }) => (
            <div
              key={key}
              className="
                flex flex-col justify-between gap-4
                p-4 rounded-lg
                bg-[hsl(var(--surface-subtle))] border border-[hsl(var(--border))]
                hover:border-[hsl(var(--ring)/0.30)] transition-all duration-150
              "
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText
                    className="w-4 h-4 text-[hsl(var(--text-secondary))]"
                    aria-hidden="true"
                  />
                  <h3 className="text-xs font-semibold text-[hsl(var(--text-primary))]">{title}</h3>
                </div>
                <p className="text-[11px] text-[hsl(var(--text-muted))] leading-relaxed">{desc}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                isLoading={exportPending === key}
                disabled={exportPending !== null}
                onClick={() => handleDownload(key, filename)}
                className="w-full"
              >
                {exportPending !== key && <Download className="w-3.5 h-3.5" aria-hidden="true" />}
                {exportPending === key ? 'Exporting…' : 'Download CSV'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Analytics Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Utilization */}
        <div className="card p-6 space-y-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--text-primary))]">
            <BarChart2 className="w-4 h-4 text-[hsl(var(--primary))]" aria-hidden="true" />
            Category Allocation Rates (%)
          </h2>
          <div className="h-64" aria-label="Category allocation rates chart">
            {data.categoryUtilization.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.categoryUtilization}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(220 14% 18%)"
                    opacity={0.4}
                  />
                  <XAxis
                    dataKey="categoryName"
                    stroke="hsl(215 16% 38%)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(215 16% 38%)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                  />
                  <Bar
                    dataKey="utilizationRate"
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                    name="Checkout Rate (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--text-muted))] italic">
                  No utilization data yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="card p-6 space-y-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--text-primary))]">
            <PieIcon className="w-4 h-4 text-[hsl(var(--success))]" aria-hidden="true" />
            Asset Status Distribution
          </h2>
          <div
            className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4"
            aria-label="Asset status distribution chart"
          >
            {statusPieData.length > 0 ? (
              <>
                <div className="w-full sm:w-3/5 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        itemStyle={{ color: 'hsl(210 20% 98%)', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-2/5 space-y-2">
                  {statusPieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-[11px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.color }}
                        aria-hidden="true"
                      />
                      <span className="text-[hsl(var(--text-secondary))] font-medium flex-1 min-w-0 truncate">
                        {entry.name}
                      </span>
                      <span className="text-[hsl(var(--text-primary))] font-bold tabular-nums">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--text-muted))] italic">
                  No asset status data recorded
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Booking Demand Heatmap */}
        <div className="card p-6 space-y-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--text-primary))]">
            <Calendar className="w-4 h-4 text-[hsl(var(--warning))]" aria-hidden="true" />
            Peak Booking Demand by Weekday
          </h2>
          <div className="h-64" aria-label="Booking demand by weekday chart">
            {data.bookingHeatmap.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.bookingHeatmap}
                  margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" opacity={0.4} />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(215 16% 38%)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(215 16% 38%)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={{ ...tooltipItemStyle, color: CHART_COLORS[2] }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS[2]}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS[2], r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    name="Booking Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--text-muted))] italic">
                  No booking demand data yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Frequency */}
        <div className="card p-6 space-y-4">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--text-primary))]">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--primary))]" aria-hidden="true" />
            Maintenance Tickets by Category
          </h2>
          <div
            className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4"
            aria-label="Maintenance tickets chart"
          >
            {data.maintenanceFrequency.some((item) => item.count > 0) ? (
              <>
                <div className="w-full sm:w-3/5 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.maintenanceFrequency.filter((item) => item.count > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        nameKey="categoryName"
                        paddingAngle={2}
                      >
                        {data.maintenanceFrequency
                          .filter((item) => item.count > 0)
                          .map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                              strokeWidth={0}
                            />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        itemStyle={{ color: 'hsl(210 20% 98%)', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-2/5 space-y-2">
                  {data.maintenanceFrequency
                    .filter((item) => item.count > 0)
                    .map((entry, index) => (
                      <div key={entry.categoryName} className="flex items-center gap-2 text-[11px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          aria-hidden="true"
                        />
                        <span className="text-[hsl(var(--text-secondary))] font-medium flex-1 min-w-0 truncate">
                          {entry.categoryName}
                        </span>
                        <span className="text-[hsl(var(--text-primary))] font-bold tabular-nums">
                          {entry.count}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))]">
                <p className="text-xs text-[hsl(var(--text-muted))] italic">
                  No maintenance incidents reported
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
