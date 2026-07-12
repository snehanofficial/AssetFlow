export const Dashboard = () => {
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Total Assets', 'Active Allocations', 'Scheduled Bookings', 'Open Repairs'].map(
          (stat, idx) => (
            <div key={idx} className="card-elevation p-6 flex flex-col gap-2">
              <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">
                {stat}
              </span>
              <span className="text-2xl font-bold font-display text-text-primary">0</span>
            </div>
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-elevation p-6 lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-sm text-text-primary">Asset Allocation Trends</h3>
          <div className="h-64 bg-background/50 border border-border/50 rounded flex items-center justify-center text-text-muted text-xs">
            Chart Visualization Placeholder
          </div>
        </div>

        <div className="card-elevation p-6 space-y-4">
          <h3 className="font-semibold text-sm text-text-primary">Overdue Returns</h3>
          <div className="h-64 bg-background/50 border border-border/50 rounded flex items-center justify-center text-text-muted text-xs">
            No Overdue Items
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
