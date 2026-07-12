export const AuditList = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          Compliance Audits
        </h1>
        <p className="text-slate-400 text-xs">
          Organize audit cycles and execute checker lists to reconcile discrepancies.
        </p>
      </div>

      <div className="card-elevation p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <span className="text-sm font-semibold">Active Campaigns</span>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer">
            + Start Audit Cycle
          </button>
        </div>

        <div className="h-96 bg-slate-900/50 rounded flex items-center justify-center text-slate-500 text-xs">
          Audit cycle listings placeholder
        </div>
      </div>
    </div>
  );
};

export default AuditList;
