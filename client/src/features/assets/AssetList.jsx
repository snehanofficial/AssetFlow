export const AssetList = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          Asset Directory
        </h1>
        <p className="text-slate-400 text-xs">Browse, filter, and register physical assets.</p>
      </div>

      <div className="card-elevation p-6 space-y-4">
        <div className="flex justify-between items-center">
          <input
            type="text"
            placeholder="Filter assets by tag, name, or status..."
            className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300 w-80 focus:outline"
          />
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer">
            + Register Asset
          </button>
        </div>

        <div className="h-96 bg-slate-900/50 rounded flex items-center justify-center text-slate-500 text-xs">
          Asset List Data Table Placeholder
        </div>
      </div>
    </div>
  );
};

export default AssetList;
