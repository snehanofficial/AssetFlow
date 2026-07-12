export const MaintenanceKanban = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          Maintenance & Repair dispatch
        </h1>
        <p className="text-slate-400 text-xs">
          Triage and process repair tasks across departments.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((column) => (
          <div
            key={column}
            className="w-80 flex-shrink-0 card-elevation p-4 space-y-4 bg-slate-900/30"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {column}
              </span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                0
              </span>
            </div>
            <div className="h-96 bg-slate-950/20 rounded flex items-center justify-center text-slate-600 text-xs">
              No tickets
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaintenanceKanban;
