export const AuditList = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          Compliance Audits
        </h1>
        <p className="text-text-secondary text-xs">
          Organize audit cycles and execute checker lists to reconcile discrepancies.
        </p>
      </div>

      <div className="card-elevation p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <span className="text-sm font-semibold text-text-primary">Active Campaigns</span>
          <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all">
            + Start Audit Cycle
          </button>
        </div>

        <div className="h-96 bg-background/50 border border-border/50 rounded flex items-center justify-center text-text-muted text-xs">
          Audit cycle listings placeholder
        </div>
      </div>
    </div>
  );
};

export default AuditList;
