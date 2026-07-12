export const AllocationList = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          Asset Custody & Allocations
        </h1>
        <p className="text-slate-400 text-xs">
          Manage custodian assignments, return processing, and custody transfers.
        </p>
      </div>

      <div className="card-elevation p-6 space-y-4">
        <div className="flex gap-6 border-b border-slate-800 pb-4">
          <button className="text-sm font-semibold pb-4 -mb-4 border-b-2 border-indigo-500 text-indigo-400 cursor-pointer">
            Active Allocations
          </button>
          <button className="text-sm font-semibold pb-4 -mb-4 border-b-2 border-transparent text-slate-400 hover:text-white cursor-pointer">
            Transfer Inbox
          </button>
        </div>

        <div className="h-96 bg-slate-900/50 rounded flex items-center justify-center text-slate-500 text-xs">
          Custody list table placeholder
        </div>
      </div>
    </div>
  );
};

export default AllocationList;
