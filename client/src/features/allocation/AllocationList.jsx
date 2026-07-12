export const AllocationList = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          Asset Custody & Allocations
        </h1>
        <p className="text-text-secondary text-xs">
          Manage custodian assignments, return processing, and custody transfers.
        </p>
      </div>

      <div className="card-elevation p-6 space-y-4">
        <div className="flex gap-6 border-b border-border pb-4">
          <button className="text-sm font-semibold pb-4 -mb-4 border-b-2 border-primary text-primary cursor-pointer transition-all">
            Active Allocations
          </button>
          <button className="text-sm font-semibold pb-4 -mb-4 border-b-2 border-transparent text-text-secondary hover:text-text-primary cursor-pointer transition-all">
            Transfer Inbox
          </button>
        </div>

        <div className="h-96 bg-background/50 border border-border/50 rounded flex items-center justify-center text-text-muted text-xs">
          Custody list table placeholder
        </div>
      </div>
    </div>
  );
};

export default AllocationList;
