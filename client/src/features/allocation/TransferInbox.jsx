import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  X,
  Check,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  Package,
} from 'lucide-react';
import { fetchTransfers, createTransfer, updateTransferStatus } from './allocation.api.js';
import apiFetch from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/common/Providers.jsx';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  APPROVED: {
    label: 'Approved',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  REJECTED: { label: 'Rejected', className: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

const transferSchema = z.object({
  assetId: z.string().uuid('Please select an asset.'),
  targetEmployeeId: z.string().uuid('Please select a target employee.'),
  reason: z.string().trim().max(500).optional(),
});

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * TransferInbox
 * Full management view for transfer requests (list + create + approve/reject).
 */
export const TransferInbox = ({ defaultTransferTarget, onClearDefault }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(!!defaultTransferTarget?.assetId);

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    onClearDefault?.();
  };

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const limit = 15;

  const canManage =
    user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER' || user?.role === 'DEPT_HEAD';

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['transfers', { page, limit, status: statusFilter }],
    queryFn: () => fetchTransfers({ page, limit, status: statusFilter }),
    keepPreviousData: true,
  });

  const records = data?.data?.records ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Approve/reject mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status, rejectReason }) =>
      updateTransferStatus(id, { status, rejectReason }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      showToast(
        `Transfer request ${vars.status === 'APPROVED' ? 'approved' : 'rejected'}.`,
        'success'
      );
      setRejectingId(null);
      setRejectReason('');
    },
    onError: (err) => showToast(err.message || 'Failed to update transfer.', 'error'),
  });

  const handleApprove = (id) => statusMutation.mutate({ id, status: 'APPROVED' });
  const handleReject = (id) => {
    if (!rejectReason.trim()) {
      showToast('Please enter a rejection reason.', 'warning');
      return;
    }
    statusMutation.mutate({ id, status: 'REJECTED', rejectReason });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <ArrowRightLeft size={24} className="text-primary" />
            Transfer Requests
          </h1>
          <p className="text-text-secondary text-xs">
            {total > 0 ? `${total} request${total !== 1 ? 's' : ''}` : 'No requests'} —{' '}
            {STATUS_CONFIG[statusFilter]?.label ?? 'All'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-surface transition-all"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <ArrowRightLeft size={13} />
            New Transfer
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-surface/40 p-1 rounded-lg border border-border/50 w-fit">
        {[
          { key: 'PENDING', label: 'Pending' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'REJECTED', label: 'Rejected' },
          { key: '', label: 'All' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transfers table */}
      <div className="card-elevation overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <ArrowRightLeft size={40} className="text-text-muted/30" />
            <p className="text-text-muted text-sm font-medium">No transfer requests found</p>
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
                    Requester
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Target
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">
                    Date
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
                {records.map((tx) => {
                  const statusCfg = STATUS_CONFIG[tx.status] ?? { label: tx.status, className: '' };
                  return (
                    <tr key={tx.id} className="hover:bg-surface/40 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-text-primary">{tx.asset?.name}</p>
                          <p className="text-[10px] text-primary font-mono font-semibold">
                            {tx.asset?.assetTag}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {tx.requestedBy?.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {tx.targetEmployee?.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.className}`}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          {tx.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-1.5">
                              {rejectingId === tx.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="Rejection reason..."
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="bg-background border border-border rounded px-2 py-1 text-[10px] text-text-primary w-40 focus:outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && handleReject(tx.id)}
                                  />
                                  <button
                                    onClick={() => handleReject(tx.id)}
                                    className="px-2 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-medium hover:bg-rose-500/30 transition-all"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingId(null);
                                      setRejectReason('');
                                    }}
                                    className="text-text-muted hover:text-text-primary transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleApprove(tx.id)}
                                    disabled={statusMutation.isPending}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                                  >
                                    <Check size={10} />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setRejectingId(tx.id)}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded hover:bg-rose-500/20 transition-all"
                                  >
                                    <XCircle size={10} />
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                          {tx.status !== 'PENDING' && tx.approvedBy && (
                            <span className="text-[10px] text-text-muted">
                              by {tx.approvedBy?.name}
                            </span>
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
                className="p-1.5 rounded border border-border text-text-muted hover:bg-surface disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-text-secondary px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-border text-text-muted hover:bg-surface disabled:opacity-30 transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create transfer modal */}
      {showCreateModal && (
        <TransferCreateModal
          defaultAssetId={defaultTransferTarget?.assetId}
          onClose={handleCloseCreateModal}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            handleCloseCreateModal();
          }}
        />
      )}
    </div>
  );
};

// Inner modal for creating transfer requests
function TransferCreateModal({ defaultAssetId, onClose, onSuccess }) {
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      assetId: defaultAssetId || '',
      targetEmployeeId: '',
      reason: '',
    },
  });

  // Fetch allocated assets
  const { data: assetsData } = useQuery({
    queryKey: ['assets', { status: 'ALLOCATED', limit: 100 }],
    queryFn: () => apiFetch('/assets?status=ALLOCATED&limit=100'),
  });
  const allocatedAssets = assetsData?.data?.records ?? [];

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees', { status: 'ACTIVE' }],
    queryFn: () => apiFetch('/organization/employees?status=ACTIVE&limit=200'),
  });
  const employees = employeesData?.data?.records ?? employeesData?.data ?? [];

  const mutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      showToast('Transfer request created!', 'success');
      onSuccess?.();
    },
    onError: (err) => showToast(err.message || 'Failed to create transfer.', 'error'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-text-primary">New Transfer Request</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(async (d) => {
            await mutation.mutateAsync(d);
          })}
          className="p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1">
              <Package size={12} /> Asset <span className="text-rose-400">*</span>
            </label>
            <select {...register('assetId')} className={inputClass(errors.assetId)}>
              <option value="">Select an allocated asset...</option>
              {allocatedAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetTag} — {a.name}
                </option>
              ))}
            </select>
            {errors.assetId && <FieldError msg={errors.assetId.message} />}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1">
              <User size={12} /> Transfer To <span className="text-rose-400">*</span>
            </label>
            <select
              {...register('targetEmployeeId')}
              className={inputClass(errors.targetEmployeeId)}
            >
              <option value="">Select target employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
            {errors.targetEmployeeId && <FieldError msg={errors.targetEmployeeId.message} />}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">Reason (optional)</label>
            <textarea
              {...register('reason')}
              rows={2}
              placeholder="Why is this transfer needed?"
              className={`w-full ${inputClass()} resize-none`}
            />
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle size={13} className="text-rose-400" />
              <p className="text-xs text-rose-300">{mutation.error?.message}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-text-secondary border border-border rounded-lg hover:bg-surface transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-500 disabled:opacity-50 transition-all"
            >
              {mutation.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowRightLeft size={12} />
              )}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputClass(error) {
  return `w-full bg-background border ${error ? 'border-rose-500/50' : 'border-border'} rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all`;
}

function FieldError({ msg }) {
  return (
    <p className="flex items-center gap-1 text-[10px] text-rose-400">
      <AlertCircle size={10} />
      {msg}
    </p>
  );
}

export default TransferInbox;
