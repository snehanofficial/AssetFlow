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
import { Download, RefreshCw, BarChart2, ShieldAlert, PieChart as PieIcon, TrendingUp, Calendar } from 'lucide-react';

export const AnalyticsDashboard = () => {
  const { showToast } = useToast();
  const [exportPending, setExportPending] = useState(null);

  // Fetch summary report aggregates
  const { data: analyticsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => apiFetch('/reports/summary'),
  });

  const data = analyticsResponse?.data || {
    statusDistribution: {
      AVAILABLE: 0,
      ALLOCATED: 0,
      UNDER_MAINTENANCE: 0,
      LOST: 0,
      RETIRED: 0,
    },
    categoryUtilization: [],
    maintenanceFrequency: [],
    bookingHeatmap: [],
  };

  // Secure download trigger using sessionStorage Authorization tokens
  const handleDownload = async (type, filename) => {
    setExportPending(type);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`/api/v1/reports/export?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Export file creation failed.');
      }

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

  // Setup color constants matching slate brand palette
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
  const STATUS_COLORS = {
    AVAILABLE: '#10b981',
    ALLOCATED: '#3b82f6',
    UNDER_MAINTENANCE: '#f59e0b',
    LOST: '#ef4444',
    RETIRED: '#6b7280',
    DISPOSED: '#4b5563',
  };

  // Format status distribution for pie chart
  const statusPieData = Object.keys(data.statusDistribution).map((key) => ({
    name: key.replace('_', ' '),
    value: data.statusDistribution[key],
    color: STATUS_COLORS[key] || '#6b7280',
  })).filter(item => item.value > 0);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-surface/50 w-64 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="card-elevation h-80 bg-surface/50 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-elevation p-8 border-destructive/20 bg-destructive/5 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-destructive mx-auto" />
        <h3 className="font-semibold text-text-primary text-sm">Access Denied / Failed to load analytics</h3>
        <p className="text-text-secondary text-xs">{error.message || 'Verify manager session active.'}</p>
        <button
          onClick={() => refetch()}
          className="text-primary hover:underline font-semibold text-xs flex items-center gap-1 mx-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Load
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
            Reports & Analytics
          </h1>
          <p className="text-text-secondary text-xs">
            Export data streams, inspect utilization logs, and evaluate repair costs.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 border border-border rounded-md hover:bg-surface-hover text-text-primary transition-all cursor-pointer bg-surface"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Exporter downloads panel */}
      <div className="card-elevation p-6 space-y-4">
        <h3 className="font-semibold text-sm text-text-primary flex items-center gap-1.5 border-b border-border/40 pb-3">
          <Download className="w-4.5 h-4.5 text-text-secondary" />
          Raw Spreadsheet Exports
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Export Assets */}
          <div className="p-4 bg-background border border-border/80 rounded-lg flex flex-col justify-between gap-3 hover:border-primary/20 transition-all shadow-sm">
            <div>
              <h4 className="font-bold text-xs text-text-primary">Asset Registry</h4>
              <p className="text-text-secondary text-xxs mt-1 leading-relaxed">
                Download a clean listing of all categories, tags, costs, serial numbers, and locations.
              </p>
            </div>
            <button
              onClick={() => handleDownload('assets', `assets_registry_${Date.now()}.csv`)}
              disabled={exportPending !== null}
              className="mt-2 w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-primary-foreground font-semibold text-xxs py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {exportPending === 'assets' ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>

          {/* Export Bookings */}
          <div className="p-4 bg-background border border-border/80 rounded-lg flex flex-col justify-between gap-3 hover:border-primary/20 transition-all shadow-sm">
            <div>
              <h4 className="font-bold text-xs text-text-primary">Booking Schedules</h4>
              <p className="text-text-secondary text-xxs mt-1 leading-relaxed">
                Download all reservation details including requester emails, start/end dates, and descriptions.
              </p>
            </div>
            <button
              onClick={() => handleDownload('bookings', `bookings_log_${Date.now()}.csv`)}
              disabled={exportPending !== null}
              className="mt-2 w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-primary-foreground font-semibold text-xxs py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {exportPending === 'bookings' ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>

          {/* Export Repairs */}
          <div className="p-4 bg-background border border-border/80 rounded-lg flex flex-col justify-between gap-3 hover:border-primary/20 transition-all shadow-sm">
            <div>
              <h4 className="font-bold text-xs text-text-primary">Repair Logs</h4>
              <p className="text-text-secondary text-xxs mt-1 leading-relaxed">
                Download past maintenance tickets, triages, assigned technicians, and resolution details.
              </p>
            </div>
            <button
              onClick={() => handleDownload('maintenance', `maintenance_tickets_${Date.now()}.csv`)}
              disabled={exportPending !== null}
              className="mt-2 w-full bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-primary-foreground font-semibold text-xxs py-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {exportPending === 'maintenance' ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Utilization Rates */}
        <div className="card-elevation p-6 space-y-4">
          <h3 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-primary" /> Category Allocation Rates (%)
          </h3>
          <div className="h-64">
            {data.categoryUtilization.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryUtilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="categoryName" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '6px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ color: '#3b82f6', fontSize: '11px' }}
                  />
                  <Bar dataKey="utilizationRate" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Checkout Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-xxs italic">
                No utilization logs reported
              </div>
            )}
          </div>
        </div>

        {/* Asset status distribution */}
        <div className="card-elevation p-6 space-y-4">
          <h3 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
            <PieIcon className="w-4 h-4 text-success" /> Asset Registry Status Distribution
          </h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4">
            {statusPieData.length > 0 ? (
              <>
                <div className="w-full sm:w-2/3 h-full">
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
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '6px' }}
                        itemStyle={{ color: '#f8fafc', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="w-full sm:w-1/3 space-y-2">
                  {statusPieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xxs">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-text-secondary font-medium">{entry.name}:</span>
                      <span className="text-text-primary font-bold ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-text-muted text-xxs italic">
                No asset status metrics recorded
              </div>
            )}
          </div>
        </div>

        {/* Peak Bookings Heatmap by Day */}
        <div className="card-elevation p-6 space-y-4">
          <h3 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-warning" /> Peak Booking Demand by Weekday
          </h3>
          <div className="h-64">
            {data.bookingHeatmap.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.bookingHeatmap} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                  <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '6px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ color: '#f59e0b', fontSize: '11px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                    name="Schedules Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-xxs italic">
                No booking metrics scheduled
              </div>
            )}
          </div>
        </div>

        {/* Maintenance frequency */}
        <div className="card-elevation p-6 space-y-4">
          <h3 className="font-bold text-xs text-text-primary flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Maintenance Tickets by Category
          </h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-4">
            {data.maintenanceFrequency.some((item) => item.count > 0) ? (
              <>
                <div className="w-full sm:w-2/3 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.maintenanceFrequency.filter((item) => item.count > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        nameKey="categoryName"
                      >
                        {data.maintenanceFrequency
                          .filter((item) => item.count > 0)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '6px' }}
                        itemStyle={{ color: '#f8fafc', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="w-full sm:w-1/3 space-y-2">
                  {data.maintenanceFrequency
                    .filter((item) => item.count > 0)
                    .map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-xxs">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></span>
                        <span className="text-text-secondary font-medium">{entry.categoryName}:</span>
                        <span className="text-text-primary font-bold ml-auto">{entry.count}</span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-text-muted text-xxs italic">
                No maintenance incidents reported
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
