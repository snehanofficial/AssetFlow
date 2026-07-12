import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { AuditDiscrepancies } from './AuditDiscrepancies.jsx';
import apiFetch from '../../utils/api.js';
import { useToast } from '../../components/common/Providers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  FolderOpen,
  User,
  X,
  Plus,
  ArrowLeft,
  Lock,
  LockOpen,
  RefreshCw,
  Search,
} from 'lucide-react';

export const AuditList = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Route/View states
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [checklistSearch, setChecklistSearch] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  // 1. Fetch Audit Cycles
  const { data: cyclesResponse, isLoading: loadingCycles } = useQuery({
    queryKey: ['audits', 'list'],
    queryFn: () => apiFetch('/audits'),
  });
  const cycles = cyclesResponse?.data || [];

  // 2. Fetch specific cycle sheet details
  const { data: cycleDetailsResponse, isLoading: loadingDetails } = useQuery({
    queryKey: ['audits', 'details', selectedCycleId],
    queryFn: () => apiFetch(`/audits/${selectedCycleId}`),
    enabled: !!selectedCycleId,
  });
  const cycleDetails = cycleDetailsResponse?.data;

  // 3. Fetch Departments for creation dropdown
  const { data: deptsResponse } = useQuery({
    queryKey: ['departments', 'audit-dropdown'],
    queryFn: () => apiFetch('/organization/departments'),
    enabled: showCreateModal && isAdmin,
  });
  const departments = deptsResponse?.data?.records || [];

  // 4. Fetch Employees to assign as auditors
  const { data: employeesResponse } = useQuery({
    queryKey: ['employees', 'audit-auditors'],
    queryFn: () => apiFetch('/organization/employees?limit=100'),
    enabled: showCreateModal && isAdmin,
  });
  const employees = employeesResponse?.data?.records || [];

  // React Hook Form for creation
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    watch: watchCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm({
    defaultValues: {
      title: '',
      scopeType: 'location',
      scopeValueLocation: '',
      scopeValueDepartment: '',
      endDate: '',
      auditorIds: [],
    },
  });

  const scopeType = watchCreate('scopeType');

  // Form for item auditing notes
  const [itemNotes, setItemNotes] = useState({});

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) =>
      apiFetch('/audits', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      showToast('Audit cycle initialized successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      setShowCreateModal(false);
      resetCreate();
    },
    onError: (err) => {
      showToast(err.message || 'Failed to create audit cycle.', 'error');
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, status, notes }) =>
      apiFetch(`/audits/items/${itemId}`, {
        method: 'PATCH',
        body: { status, notes },
      }),
    onSuccess: () => {
      showToast('Item verified.', 'success');
      queryClient.invalidateQueries({ queryKey: ['audits', 'details', selectedCycleId] });
    },
    onError: (err) => {
      showToast(err.message || 'Failed to update item verification status.', 'error');
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id) =>
      apiFetch(`/audits/${id}/close`, {
        method: 'POST',
      }),
    onSuccess: () => {
      showToast('Audit cycle closed and locked. Asset statuses cascaded.', 'success');
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['audits', 'details', selectedCycleId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
    },
    onError: (err) => {
      showToast(err.message || 'Failed to close audit cycle.', 'error');
    },
  });

  const handleCreateSubmit = (data) => {
    const scopeValue =
      data.scopeType === 'location' ? data.scopeValueLocation : data.scopeValueDepartment;

    if (!scopeValue) {
      showToast('Scope selection value is required.', 'error');
      return;
    }

    createMutation.mutate({
      title: data.title,
      scopeType: data.scopeType,
      scopeValue,
      endDate: data.endDate,
      auditorIds: data.auditorIds,
    });
  };

  // Helper selectors
  const parseScope = (scopeStr) => {
    try {
      const scope = JSON.parse(scopeStr);
      if (scope.type === 'department') {
        const dept = departments.find((d) => d.id === scope.value);
        return `Department: ${dept ? dept.name : 'Engineering (Seeded)'}`;
      }
      return `Location: ${scope.value}`;
    } catch {
      return scopeStr || 'Unknown Scope';
    }
  };

  // Discrepancies statistics
  const getAuditStats = (items = []) => {
    const total = items.length;
    const verified = items.filter((i) => i.status === 'VERIFIED').length;
    const missing = items.filter((i) => i.status === 'MISSING').length;
    const damaged = items.filter((i) => i.status === 'DAMAGED').length;
    const pending = items.filter((i) => i.status === 'PENDING').length;
    const completed = total - pending;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, verified, missing, damaged, pending, percent };
  };

  if (selectedCycleId) {
    // ----------------------------------------------------
    // CHECKLIST DETAIL SHEET VIEW
    // ----------------------------------------------------
    if (loadingDetails) {
      return (
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-[hsl(var(--surface))]/50 w-64 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="card-elevation h-24 bg-[hsl(var(--surface))]/50 rounded-lg"
              ></div>
            ))}
          </div>
          <div className="h-96 bg-[hsl(var(--surface))]/50 rounded-lg"></div>
        </div>
      );
    }

    if (!cycleDetails) {
      return (
        <div className="card-elevation p-8 text-center text-[hsl(var(--text-secondary))] text-sm space-y-3">
          <p>Audit cycle not found.</p>
          <button
            onClick={() => setSelectedCycleId(null)}
            className="text-[hsl(var(--primary))] hover:underline font-semibold flex items-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to listings
          </button>
        </div>
      );
    }

    const stats = getAuditStats(cycleDetails.items);
    const isCycleOpen = cycleDetails.status === 'IN_PROGRESS';
    const isAuditor = cycleDetails.auditors.some((a) => a.id === user?.id) || isAdmin;

    // Filter items
    const filteredItems = cycleDetails.items.filter(
      (item) =>
        item.asset.assetTag.toLowerCase().includes(checklistSearch.toLowerCase()) ||
        item.asset.name.toLowerCase().includes(checklistSearch.toLowerCase()) ||
        item.status.toLowerCase().includes(checklistSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Back navigation & details */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[hsl(var(--border)/0.40)] pb-4">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCycleId(null)}
              className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] text-xs font-semibold flex items-center gap-1.5 cursor-pointer bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-3 py-1 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Audits
            </button>
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[hsl(var(--text-primary))]">
                {cycleDetails.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xxs text-[hsl(var(--text-secondary))]">
                <span className="font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wider">
                  {parseScope(cycleDetails.scope)}
                </span>
                <span>•</span>
                <span>Due Date: {new Date(cycleDetails.endDate).toLocaleDateString()}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {isCycleOpen ? (
                    <>
                      <LockOpen className="w-3 h-3 text-[hsl(var(--primary))]" /> Active Sheet
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-[hsl(var(--text-muted))]" /> Locked & Closed
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Close Cycle trigger for Admin */}
          {isAdmin && isCycleOpen && (
            <button
              onClick={() => {
                if (stats.pending > 0) {
                  showToast(
                    `Cannot close cycle. There are still ${stats.pending} pending items.`,
                    'warning'
                  );
                  return;
                }
                if (
                  confirm(
                    'Are you sure you want to close and lock this audit cycle? This action is irreversible.'
                  )
                ) {
                  closeMutation.mutate(cycleDetails.id);
                }
              }}
              disabled={closeMutation.isPending || stats.pending > 0}
              className={`font-semibold text-xs py-2 px-4 rounded-md transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                stats.pending > 0
                  ? 'bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--text-muted))] cursor-not-allowed'
                  : 'bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] text-[hsl(var(--primary))]-foreground shadow-[hsl(var(--primary)/0.20)]'
              }`}
            >
              <Lock className="w-4 h-4" />
              Close & Lock Cycle
            </button>
          )}
        </div>

        {/* Audit Stats Dashboard Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-elevation p-5 bg-[hsl(var(--surface))] flex flex-col justify-between">
            <span className="text-[hsl(var(--text-muted))] text-xxs font-semibold uppercase tracking-wider">
              Verification Progress
            </span>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-bold font-display text-[hsl(var(--text-primary))]">
                {stats.percent}%
              </span>
              <span className="text-xxs text-[hsl(var(--text-secondary))]">
                {stats.total - stats.pending} / {stats.total} Items
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-1.5 mt-3 overflow-hidden">
              <div
                className="bg-[hsl(var(--primary))] h-1.5 rounded-full transition-all"
                style={{ width: `${stats.percent}%` }}
              ></div>
            </div>
          </div>

          <div className="card-elevation p-5 bg-[hsl(var(--surface))]/50 border-[hsl(var(--success)/0.20)]">
            <span className="text-[hsl(var(--success))] text-xxs font-semibold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Ok
            </span>
            <span className="text-3xl font-bold font-display text-[hsl(var(--text-primary))] block mt-3">
              {stats.verified}
            </span>
            <span className="text-xxs text-[hsl(var(--text-muted))] mt-2 block">
              Confirmed on-site
            </span>
          </div>

          <div className="card-elevation p-5 bg-[hsl(var(--surface))]/50 border-[hsl(var(--danger))]/20">
            <span className="text-[hsl(var(--danger))] text-xxs font-semibold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Missing (Discrepancy)
            </span>
            <span className="text-3xl font-bold font-display text-[hsl(var(--text-primary))] block mt-3">
              {stats.missing}
            </span>
            <span className="text-xxs text-[hsl(var(--text-muted))] mt-2 block">
              Will cascade to LOST status
            </span>
          </div>

          <div className="card-elevation p-5 bg-[hsl(var(--surface))]/50 border-[hsl(var(--warning)/0.20)]">
            <span className="text-[hsl(var(--warning))] text-xxs font-semibold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Damaged (Discrepancy)
            </span>
            <span className="text-3xl font-bold font-display text-[hsl(var(--text-primary))] block mt-3">
              {stats.damaged}
            </span>
            <span className="text-xxs text-[hsl(var(--text-muted))] mt-2 block">
              Will trigger repair workflow
            </span>
          </div>
        </div>

        {/* Auditor List banner */}
        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[hsl(var(--text-secondary))]" />
            <span className="text-[hsl(var(--text-secondary))] font-semibold">
              Assigned Auditors:
            </span>
            <span className="text-[hsl(var(--text-primary))]">
              {cycleDetails.auditors.map((a) => a.name).join(', ')}
            </span>
          </div>
          {!isAuditor && isCycleOpen && (
            <div className="text-xxs text-[hsl(var(--warning))] font-semibold">
              ⚠️ You are not assigned to audit this sheet. Viewing in Read-Only mode.
            </div>
          )}
        </div>

        {/* Checker Checklist Grid */}
        <div className="card-elevation p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="font-semibold text-sm text-[hsl(var(--text-primary))]">
              Auditor Verification Sheet
            </h3>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-[hsl(var(--text-muted))]" />
              <input
                type="text"
                placeholder="Search by tag, name or status..."
                value={checklistSearch}
                onChange={(e) => setChecklistSearch(e.target.value)}
                className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md pl-9 pr-4 py-1.5 text-xs text-[hsl(var(--text-primary))] focus:outline-none focus:border-[hsl(var(--primary))]"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))]/50">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] font-semibold uppercase tracking-wider text-xxs">
                  <th className="px-4 py-3">Asset Tag</th>
                  <th className="px-4 py-3">Asset Details</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Audit Verification State</th>
                  <th className="px-4 py-3">Notes & Observations</th>
                  {isCycleOpen && isAuditor && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((item) => {
                  const verifiedByStr = item.verifiedBy
                    ? `By: ${item.verifiedBy.name} on ${new Date(item.verifiedAt).toLocaleDateString()}`
                    : 'Unchecked';

                  const canAuditItem = isCycleOpen && isAuditor;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[hsl(var(--surface))]-hover/50 text-[hsl(var(--text-secondary))]"
                    >
                      <td className="px-4 py-4 whitespace-nowrap font-mono font-bold text-[hsl(var(--text-primary))] text-[11px]">
                        {item.asset.assetTag}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-[hsl(var(--text-primary))] leading-snug">
                          {item.asset.name}
                        </p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))] mt-0.5">
                          Location: {item.asset.location}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] text-[hsl(var(--text-muted))] bg-[hsl(var(--surface))] px-2 py-0.5 rounded border border-[hsl(var(--border)/0.50)]">
                          {item.asset.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {canAuditItem ? (
                          <select
                            defaultValue={item.status}
                            onChange={(e) => {
                              // Perform update directly on select shift if no notes required,
                              // or auditor can write notes and click action.
                              updateItemMutation.mutate({
                                itemId: item.id,
                                status: e.target.value,
                                notes: itemNotes[item.id] || item.notes || '',
                              });
                            }}
                            className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded text-xs px-2.5 py-1 focus:outline-none focus:border-[hsl(var(--primary))] text-[hsl(var(--text-primary))] font-medium"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="VERIFIED">VERIFIED OK</option>
                            <option value="MISSING">MISSING</option>
                            <option value="DAMAGED">DAMAGED</option>
                          </select>
                        ) : (
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                item.status === 'VERIFIED'
                                  ? 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.30)]'
                                  : item.status === 'MISSING'
                                    ? 'bg-[hsl(var(--danger)/0.15)] text-[hsl(var(--danger))] border-[hsl(var(--danger))]/30'
                                    : item.status === 'DAMAGED'
                                      ? 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.30)]'
                                      : 'bg-[hsl(var(--text-muted)/0.15)] text-[hsl(var(--text-muted))] border-[hsl(var(--text-muted)/0.30)]'
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="block text-[9px] text-[hsl(var(--text-muted))] mt-1 font-normal italic">
                              {verifiedByStr}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        {canAuditItem ? (
                          <input
                            type="text"
                            placeholder="Add observations..."
                            defaultValue={item.notes || ''}
                            onChange={(e) => {
                              setItemNotes({
                                ...itemNotes,
                                [item.id]: e.target.value,
                              });
                            }}
                            onBlur={(e) => {
                              // Auto-update notes on blur if state is verified/damaged/missing
                              if (item.status !== 'PENDING') {
                                updateItemMutation.mutate({
                                  itemId: item.id,
                                  status: item.status,
                                  notes: e.target.value,
                                });
                              }
                            }}
                            className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border)/0.80)] rounded px-2 py-1 text-xs text-[hsl(var(--text-primary))] focus:outline-none focus:border-[hsl(var(--primary))]"
                          />
                        ) : (
                          <p className="italic leading-relaxed text-xxs">
                            {item.notes || (
                              <span className="text-[hsl(var(--text-muted))]/60">
                                No notes recorded
                              </span>
                            )}
                          </p>
                        )}
                      </td>
                      {canAuditItem && (
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              const noteValue = itemNotes[item.id] || item.notes || '';
                              if (item.status === 'PENDING') {
                                showToast('Please select verification status first.', 'warning');
                                return;
                              }
                              updateItemMutation.mutate({
                                itemId: item.id,
                                status: item.status,
                                notes: noteValue,
                              });
                            }}
                            className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]-hover font-semibold text-xxs py-1 px-2 border border-[hsl(var(--primary)/0.20)] hover:border-[hsl(var(--primary))] rounded bg-[hsl(var(--primary)/0.05)] transition-all cursor-pointer"
                          >
                            Save
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-[hsl(var(--text-muted))] text-xs italic"
                    >
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discrepancies Summary panel */}
        <AuditDiscrepancies items={cycleDetails.items} isClosed={!isCycleOpen} />
      </div>
    );
  }

  // ----------------------------------------------------
  // LISTINGS VIEW
  // ----------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
            Compliance Audits
          </h1>
          <p className="text-[hsl(var(--text-secondary))] text-xs">
            Organize audit cycles and execute checker lists to reconcile discrepancies.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] text-[hsl(var(--primary))]-foreground font-semibold text-xs py-2 px-4 rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto shadow-lg shadow-[hsl(var(--primary)/0.20)]"
          >
            <Plus className="w-4 h-4" />
            Start Audit Cycle
          </button>
        )}
      </div>

      {/* Main Campaign table list */}
      <div className="card-elevation p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-[hsl(var(--border))] pb-3">
          <span className="text-sm font-semibold text-[hsl(var(--text-primary))] flex items-center gap-1.5">
            <ClipboardList className="w-4.5 h-4.5 text-[hsl(var(--text-secondary))]" />
            Verification Campaigns
          </span>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['audits'] })}
            className="p-1.5 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] rounded border border-[hsl(var(--border)/0.80)] bg-[hsl(var(--surface))]/50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loadingCycles ? (
          <div className="text-center py-20 text-[hsl(var(--text-muted))] text-xs animate-pulse">
            Loading campaigns list...
          </div>
        ) : cycles.length > 0 ? (
          <div className="overflow-x-auto w-full border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--background))]/50">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] font-semibold uppercase tracking-wider text-xxs">
                  <th className="px-4 py-3">Campaign Title</th>
                  <th className="px-4 py-3">Triage Scope</th>
                  <th className="px-4 py-3">Auditors</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verification Progress</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {cycles.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[hsl(var(--surface))]-hover/50 text-[hsl(var(--text-secondary))]"
                  >
                    <td className="px-4 py-3.5 font-bold text-[hsl(var(--text-primary))]">
                      {item.title}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[10px] text-[hsl(var(--text-primary))]">
                      {parseScope(item.scope)}
                    </td>
                    <td className="px-4 py-3.5 text-xxs leading-snug">
                      {item.auditors.map((a) => a.name).join(', ')}
                    </td>
                    <td className="px-4 py-3.5">{new Date(item.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.status === 'IN_PROGRESS'
                            ? 'bg-[hsl(var(--primary)/0.10)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.20)]'
                            : 'bg-[hsl(var(--text-muted)/0.10)] text-[hsl(var(--text-muted))] border-[hsl(var(--text-muted)/0.20)]'
                        }`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xxs">{item._count.items} Scoped</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedCycleId(item.id)}
                        className="text-[hsl(var(--primary))] hover:underline font-semibold text-xxs inline-flex items-center gap-1 border border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.20)] bg-[hsl(var(--surface))] px-2.5 py-1 rounded transition-all cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Open Sheet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-48 border border-dashed border-[hsl(var(--border))] rounded-lg flex flex-col items-center justify-center text-[hsl(var(--text-muted))] text-xs p-4 text-center">
            <span>No Audit Cycles Initialized</span>
            <span className="text-xxs text-[hsl(var(--text-muted))]/70 mt-1">
              Admins can click "Start Audit Cycle" to initialize database verification checks.
            </span>
          </div>
        )}
      </div>

      {/* Start Audit Cycle Wizard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] w-full max-w-md rounded-lg p-6 space-y-6 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] rounded-md hover:bg-[hsl(var(--surface))]-hover transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-[hsl(var(--text-primary))]">
                New Verification Cycle
              </h3>
              <p className="text-[hsl(var(--text-secondary))] text-xs">
                Audit assets scoped by location or department allocations.
              </p>
            </div>

            <form onSubmit={handleSubmitCreate(handleCreateSubmit)} className="space-y-4">
              {/* Cycle Title */}
              <div className="space-y-1">
                <label
                  className="text-[hsl(var(--text-secondary))] text-xs font-semibold"
                  htmlFor="audit-title-input"
                >
                  Campaign Title
                </label>
                <input
                  id="audit-title-input"
                  type="text"
                  placeholder="e.g. Q3 Server Room Triage"
                  className={`w-full bg-[hsl(var(--background))] border rounded-md px-3 py-2 text-sm text-[hsl(var(--text-primary))] focus:outline focus:border-[hsl(var(--primary))] ${
                    createErrors.title
                      ? 'border-[hsl(var(--danger))]'
                      : 'border-[hsl(var(--border))]'
                  }`}
                  {...registerCreate('title', { required: 'Title is required.' })}
                />
                {createErrors.title && (
                  <p className="text-[hsl(var(--danger))] text-xxs font-medium mt-1">
                    {createErrors.title.message}
                  </p>
                )}
              </div>

              {/* Scope selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    className="text-[hsl(var(--text-secondary))] text-xs font-semibold"
                    htmlFor="audit-scope-type"
                  >
                    Scope Type
                  </label>
                  <select
                    id="audit-scope-type"
                    className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--text-primary))] focus:outline focus:border-[hsl(var(--primary))]"
                    {...registerCreate('scopeType')}
                  >
                    <option value="location">Location</option>
                    <option value="department">Department</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    className="text-[hsl(var(--text-secondary))] text-xs font-semibold"
                    htmlFor="audit-scope-value"
                  >
                    Scope Target
                  </label>
                  {scopeType === 'location' ? (
                    <input
                      id="audit-scope-value"
                      type="text"
                      placeholder="e.g. Building 1"
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--text-primary))] focus:outline focus:border-[hsl(var(--primary))]"
                      {...registerCreate('scopeValueLocation', {
                        required: scopeType === 'location' ? 'Location name is required.' : false,
                      })}
                    />
                  ) : (
                    <select
                      id="audit-scope-value"
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--text-primary))] focus:outline focus:border-[hsl(var(--primary))]"
                      {...registerCreate('scopeValueDepartment', {
                        required: scopeType === 'department' ? 'Department is required.' : false,
                      })}
                    >
                      <option value="">Select department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label
                  className="text-[hsl(var(--text-secondary))] text-xs font-semibold"
                  htmlFor="audit-due-date"
                >
                  Verify Due Date
                </label>
                <input
                  id="audit-due-date"
                  type="date"
                  className={`w-full bg-[hsl(var(--background))] border rounded-md px-3 py-2 text-sm text-[hsl(var(--text-primary))] focus:outline focus:border-[hsl(var(--primary))] ${
                    createErrors.endDate
                      ? 'border-[hsl(var(--danger))]'
                      : 'border-[hsl(var(--border))]'
                  }`}
                  {...registerCreate('endDate', { required: 'Verification due date is required.' })}
                />
                {createErrors.endDate && (
                  <p className="text-[hsl(var(--danger))] text-xxs font-medium mt-1">
                    {createErrors.endDate.message}
                  </p>
                )}
              </div>

              {/* Assign Auditors */}
              <div className="space-y-2">
                <label className="text-[hsl(var(--text-secondary))] text-xs font-semibold block">
                  Assign Auditors
                </label>
                <div className="border border-[hsl(var(--border))] rounded-md p-3 max-h-32 overflow-y-auto space-y-2 bg-[hsl(var(--background))]/50">
                  {employees.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-2 text-xs text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={emp.id}
                        className="rounded border-[hsl(var(--border))] focus:ring-primary text-[hsl(var(--primary))]"
                        {...registerCreate('auditorIds', {
                          required: 'At least one assigned auditor is required.',
                        })}
                      />
                      <span>
                        {emp.name} ({emp.role.replace('_', ' ')})
                      </span>
                    </label>
                  ))}
                </div>
                {createErrors.auditorIds && (
                  <p className="text-[hsl(var(--danger))] text-xxs font-medium mt-1">
                    {createErrors.auditorIds.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] disabled:bg-[hsl(var(--primary)/0.05)]5 disabled:opacity-50 text-[hsl(var(--primary))]-foreground font-semibold text-sm py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[hsl(var(--primary)/0.20)]"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[hsl(var(--primary))]-foreground border-t-transparent rounded-full animate-spin"></div>
                    <span>Locating scoped assets...</span>
                  </>
                ) : (
                  'Start Cycle'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditList;
