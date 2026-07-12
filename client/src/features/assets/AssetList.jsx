export const AssetList = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          Asset Directory
        </h1>
        <p className="text-text-secondary text-xs">Browse, filter, and register physical assets.</p>
      </div>

      <div className="card-elevation p-6 space-y-4">
        <div className="flex justify-between items-center">
          <input
            type="text"
            placeholder="Filter assets by tag, name, or status..."
            className="bg-background border border-border rounded px-3 py-1.5 text-xs text-text-primary w-80 focus:outline"
          />
          <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all">
            + Register Asset
          </button>
        </div>

        <div className="h-96 bg-background/50 border border-border/50 rounded flex items-center justify-center text-text-muted text-xs">
          Asset List Data Table Placeholder
        </div>
      </div>
    </div>
  );
};

export default AssetList;
