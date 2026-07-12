import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '../../utils/api.js';
import { RefreshCw, Search, ShieldAlert, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export const ActivityLogs = () => {
  const [actorEmail, setActorEmail] = useState('');
  const [tableName, setTableName] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const [limit] = useState(15);
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch admin audit logs
  const { data: logsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'audit-logs', actorEmail, tableName, actionFilter, page, limit],
    queryFn: () =>
      apiFetch(
        `/admin/audit-logs?actorEmail=${actorEmail}&tableName=${tableName}&action=${actionFilter}&limit=${limit}&offset=${
          page * limit
        }`
      ),
  });

  const records = logsResponse?.data?.records || [];
  const totalCount = logsResponse?.data?.total || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Helper to compute simple diff between old and new values
  const getDiff = (oldVal, newVal) => {
    if (!oldVal && !newVal) return null;
    if (!oldVal) return { type: 'ADDED', data: newVal };
    if (!newVal) return { type: 'REMOVED', data: oldVal };

    const diff = {};
    const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
    let hasChanges = false;

    for (const key of allKeys) {
      const oldStr = JSON.stringify(oldVal[key]);
      const newStr = JSON.stringify(newVal[key]);
      if (oldStr !== newStr) {
        diff[key] = {
          from: oldVal[key],
          to: newVal[key],
        };
        hasChanges = true;
      }
    }

    return hasChanges ? { type: 'UPDATED', data: diff } : null;
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'INSERT':
        return 'bg-success/10 text-success border-success/20';
      case 'UPDATE':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'DELETE':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
            System Activity Logs
          </h1>
          <p className="text-text-secondary text-xs">
            Review detailed mutations log auditing administrative and operations data updates.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 border border-border rounded-md hover:bg-surface-hover text-text-primary transition-all bg-surface cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter panel */}
      <div className="card-elevation p-4 flex flex-col md:flex-row gap-4 items-end">
        {/* Actor Search */}
        <div className="flex-1 w-full space-y-1">
          <label className="text-text-secondary text-xxs font-semibold uppercase">Actor Email</label>
          <div className="flex items-center bg-background border border-border rounded-md px-3 py-1.5 gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={actorEmail}
              onChange={(e) => {
                setActorEmail(e.target.value);
                setPage(0);
              }}
              placeholder="Search actor..."
              className="bg-transparent border-none outline-none text-text-primary text-xs w-full"
            />
          </div>
        </div>

        {/* Table Search */}
        <div className="flex-1 w-full space-y-1">
          <label className="text-text-secondary text-xxs font-semibold uppercase">Table Name</label>
          <div className="flex items-center bg-background border border-border rounded-md px-3 py-1.5 gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={tableName}
              onChange={(e) => {
                setTableName(e.target.value);
                setPage(0);
              }}
              placeholder="Search table (e.g. Asset)..."
              className="bg-transparent border-none outline-none text-text-primary text-xs w-full"
            />
          </div>
        </div>

        {/* Action Select */}
        <div className="w-full md:w-44 space-y-1">
          <label className="text-text-secondary text-xxs font-semibold uppercase">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-text-primary text-xs outline-none"
          >
            <option value="">All Actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card-elevation overflow-hidden flex flex-col justify-between min-h-[500px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-text-muted text-xs py-20 animate-pulse">
            Loading activity log records...
          </div>
        ) : records.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xxs">
                <thead>
                  <tr className="border-b border-border/80 bg-surface/50 text-text-secondary">
                    <th className="p-4 font-bold">Timestamp</th>
                    <th className="p-4 font-bold">Actor</th>
                    <th className="p-4 font-bold">Action</th>
                    <th className="p-4 font-bold">Table Mutated</th>
                    <th className="p-4 font-bold">Record ID</th>
                    <th className="p-4 font-bold">IP Address</th>
                    <th className="p-4 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {records.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-hover/30 transition-all">
                      <td className="p-4 font-medium text-text-primary whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-text-primary">{log.actor?.name || 'System'}</p>
                          <p className="text-[10px] text-text-secondary">{log.actorEmail || '-'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border rounded text-[9px] font-bold ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-text-primary text-[10px]">
                        {log.tableName}
                      </td>
                      <td className="p-4 font-mono text-text-secondary text-[10px]">
                        {log.recordId.substring(0, 8)}...
                      </td>
                      <td className="p-4 text-text-secondary whitespace-nowrap">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 border border-border rounded hover:border-primary/30 hover:text-primary transition-all cursor-pointer text-text-secondary"
                          title="Inspect changes JSON diff"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <span className="text-text-secondary text-xxs">
                Showing {page * limit + 1} - {Math.min((page + 1) * limit, totalCount)} of {totalCount} records
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 border border-border rounded-md hover:bg-surface-hover disabled:opacity-40 disabled:hover:bg-transparent text-text-primary transition-all cursor-pointer flex items-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 border border-border rounded-md hover:bg-surface-hover disabled:opacity-40 disabled:hover:bg-transparent text-text-primary transition-all cursor-pointer flex items-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-xs py-20 space-y-2">
            <ShieldAlert className="w-8 h-8 opacity-40 text-text-muted" />
            <p>No activity logs found matching the filters.</p>
          </div>
        )}
      </div>

      {/* JSON Diff Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-surface border-l border-border h-full shadow-2xl flex flex-col p-6 space-y-6 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-border/65 pb-4">
              <div>
                <h2 className="font-display font-bold text-sm text-text-primary">
                  Mutation Audit Details
                </h2>
                <p className="text-text-secondary text-[10px]">
                  Log ID: {selectedLog.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 border border-border rounded-md hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* General details grid */}
            <div className="grid grid-cols-2 gap-4 text-xxs bg-background p-4 rounded-lg border border-border/50">
              <div>
                <p className="text-text-secondary font-semibold uppercase">Actor Email</p>
                <p className="text-text-primary mt-0.5">{selectedLog.actorEmail || 'System'}</p>
              </div>
              <div>
                <p className="text-text-secondary font-semibold uppercase">Action Type</p>
                <p className="text-text-primary mt-0.5 font-bold">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-text-secondary font-semibold uppercase">Table name</p>
                <p className="text-text-primary mt-0.5 font-mono">{selectedLog.tableName}</p>
              </div>
              <div>
                <p className="text-text-secondary font-semibold uppercase">IP Address</p>
                <p className="text-text-primary mt-0.5">{selectedLog.ipAddress || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-text-secondary font-semibold uppercase">Record ID</p>
                <p className="text-text-primary mt-0.5 font-mono">{selectedLog.recordId}</p>
              </div>
            </div>

            {/* Diffs Previewer */}
            <div className="space-y-3 flex-1 flex flex-col">
              <h3 className="font-bold text-xs text-text-primary">JSON Field Mutation Diff</h3>
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-[10px] text-slate-100 overflow-auto max-h-[400px]">
                {(() => {
                  const diffObj = getDiff(selectedLog.oldValue, selectedLog.newValue);
                  if (!diffObj) {
                    return <span className="text-slate-400 italic">No field differences logged (identical contents)</span>;
                  }

                  if (diffObj.type === 'ADDED') {
                    return (
                      <pre className="text-emerald-400">
                        {JSON.stringify(diffObj.data, null, 2)}
                      </pre>
                    );
                  }

                  if (diffObj.type === 'REMOVED') {
                    return (
                      <pre className="text-rose-400">
                        {JSON.stringify(diffObj.data, null, 2)}
                      </pre>
                    );
                  }

                  // UPDATED
                  return (
                    <div className="space-y-2">
                      {Object.keys(diffObj.data).map((key) => {
                        const change = diffObj.data[key];
                        return (
                          <div key={key} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                            <span className="text-indigo-400 font-bold">{key}:</span>
                            <div className="pl-4 mt-1 space-y-1">
                              <div className="text-rose-400 flex items-start gap-1">
                                <span className="shrink-0">- From:</span>
                                <span>{JSON.stringify(change.from)}</span>
                              </div>
                              <div className="text-emerald-400 flex items-start gap-1">
                                <span className="shrink-0">+ To:</span>
                                <span>{JSON.stringify(change.to)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
