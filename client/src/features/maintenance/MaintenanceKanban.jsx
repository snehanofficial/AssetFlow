export const MaintenanceKanban = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          Maintenance & Repair dispatch
        </h1>
        <p className="text-text-secondary text-xs">
          Triage and process repair tasks across departments.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((column) => (
          <div key={column} className="w-80 shrink-0 card-elevation p-4 space-y-4 bg-surface/30">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {column}
              </span>
              <span className="text-xs bg-surface text-text-muted px-2 py-0.5 rounded-full font-bold">
                0
              </span>
            </div>
            <div className="h-96 bg-background/20 rounded flex items-center justify-center text-text-muted text-xs">
              No tickets
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaintenanceKanban;
