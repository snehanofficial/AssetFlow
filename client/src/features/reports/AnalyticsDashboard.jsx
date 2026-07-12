export const AnalyticsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          Reports & Analytics
        </h1>
        <p className="text-text-secondary text-xs">
          Export data streams, inspect utilization logs, and evaluate repair costs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-elevation p-6 h-80 flex items-center justify-center text-text-muted text-xs">
          Resource Booking Heatmap Placeholder
        </div>
        <div className="card-elevation p-6 h-80 flex items-center justify-center text-text-muted text-xs">
          Maintenance Cost Pie Chart Placeholder
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
