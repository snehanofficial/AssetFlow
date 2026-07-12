import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  User,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRightLeft,
} from 'lucide-react';
import { fetchAllocations } from './allocation.api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  RETURNED: {
    label: 'Returned',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  OVERDUE: { label: 'Overdue', className: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export const AllocationList = ({ onReturn, onTransfer }) => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [page, setPage] = useState(1);
  const limit = 15;
  const canManage =
    user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER' || user?.role === 'DEPT_HEAD';

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['allocations', { page, limit, status: statusFilter }],
    queryFn: () => fetchAllocations({ page, limit, status: statusFilter }),
    keepPreviousData: true,
  });

  const records = data?.data?.records ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <User size={24} className="text-primary" />
            Asset Allocations
          </h1>
          <p className="text-text-secondary text-xs">
            {total > 0 ? `${total} allocation${total !== 1 ? 's' : ''}` : 'No allocations'}
            {statusFilter && ` — ${STATUS_CONFIG[statusFilter]?.label ?? statusFilter}`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-all"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 bg-surface/40 p-1 rounded-lg border border-border/50 w-fit">
        {['ACTIVE', 'RETURNED', ''].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {s === '' ? 'All' : (STATUS_CONFIG[s]?.label ?? s)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card-elevation overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-text-muted text-xs">Loading allocations...</p>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Package size={40} className="text-text-muted/30" />
            <p className="text-text-muted text-sm font-medium">No allocations found</p>
            <p className="text-text-muted text-xs">
              {statusFilter === 'ACTIVE'
                ? 'No assets are currently checked out.'
                : 'No records match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-surface/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Asset
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Employee
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Since
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Return By
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Status
                  </th>
                  {canManage && (
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {records.map((alloc) => {
                  const isOverdue = alloc.isOverdue;
                  const displayStatus = isOverdue ? 'OVERDUE' : alloc.status;
                  const statusCfg = STATUS_CONFIG[displayStatus] ?? {
                    label: displayStatus,
                    className: '',
                  };

                  return (
                    <tr
                      key={alloc.id}
                      className={`transition-colors ${isOverdue ? 'bg-rose-500/3' : 'hover:bg-surface/40'}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-text-primary">
                            {alloc.asset?.name}
                          </p>
                          <p className="text-[10px] text-primary font-mono font-semibold">
                            {alloc.asset?.assetTag}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-text-primary">
                            {alloc.employee?.name}
                          </p>
                          <p className="text-[10px] text-text-muted">{alloc.employee?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-text-secondary">
                          {formatDate(alloc.allocatedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {alloc.expectedReturnAt ? (
                          <span
                            className={`text-xs ${isOverdue ? 'text-rose-400 font-semibold' : 'text-text-secondary'}`}
                          >
                            {isOverdue && <AlertTriangle size={11} className="inline mr-1" />}
                            {formatDate(alloc.expectedReturnAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.className}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          {alloc.status === 'ACTIVE' && (
                            <div className="flex items-center justify-end gap-1.5">
                              {onReturn && (
                                <button
                                  onClick={() => onReturn(alloc)}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-all"
                                >
                                  <RotateCcw size={10} />
                                  Return
                                </button>
                              )}
                              {onTransfer && (
                                <button
                                  onClick={() => onTransfer(alloc)}
                                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded hover:bg-purple-500/20 transition-all"
                                >
                                  <ArrowRightLeft size={10} />
                                  Transfer
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-xs text-text-muted">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-border text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-text-secondary px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-border text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationList;
