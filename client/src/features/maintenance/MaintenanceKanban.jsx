import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import apiFetch from '../../utils/api.js';
import { useToast } from '../../components/common/Providers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { CheckCircle, Plus, X, User } from 'lucide-react';

export const MaintenanceKanban = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Kanban and detail states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showRaiseModal, setShowRaiseModal] = useState(() => searchParams.get('action') === 'new');

  // Auto-launch Raise Repair modal if coming from Quick Actions
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      // Clean query params so it doesn't reopen on refresh
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Fetch all maintenance tickets
  const { data: ticketsResponse, isLoading: loadingTickets } = useQuery({
    queryKey: ['maintenance', 'list'],
    queryFn: () => apiFetch('/maintenance'),
  });
  const tickets = ticketsResponse?.data || [];

  // Fetch all assets for Raise Repair dropdown
  const { data: assetsResponse } = useQuery({
    queryKey: ['assets', 'list-all'],
    queryFn: () => apiFetch('/assets'),
  });
  const assets = assetsResponse?.data || [];

  // Fetch employees list for assigning technicians (managers only)
  const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(user?.role);
  const { data: employeesResponse } = useQuery({
    queryKey: ['employees', 'technicians'],
    queryFn: () => apiFetch('/organization/employees?limit=100'),
    enabled: isManager,
  });
  const employees = employeesResponse?.data?.records || [];

  // React Hook Form for raising repairs
  const {
    register: registerRaise,
    handleSubmit: handleSubmitRaise,
    reset: resetRaise,
    formState: { errors: raiseErrors },
  } = useForm({
    defaultValues: {
      assetId: '',
      priority: 'MEDIUM',
      description: '',
    },
  });

  // React Hook Forms for approve/resolve in details dialog
  const {
    register: registerAction,
    handleSubmit: handleSubmitAction,
    reset: resetAction,
  } = useForm();

  // Mutations
  const raiseMutation = useMutation({
    mutationFn: (data) =>
      apiFetch('/maintenance', {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      showToast('Repair ticket raised successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      setShowRaiseModal(false);
      resetRaise();
    },
    onError: (err) => {
      showToast(err.message || 'Failed to raise repair ticket.', 'error');
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, assignedToId }) =>
      apiFetch(`/maintenance/${id}/approve`, {
        method: 'PATCH',
        body: { assignedToId },
      }),
    onSuccess: () => {
      showToast('Ticket approved and technician assigned.', 'success');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      setSelectedTicket(null);
      resetAction();
    },
    onError: (err) => {
      showToast(err.message || 'Failed to approve request.', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      apiFetch(`/maintenance/${id}/reject`, {
        method: 'PATCH',
        body: { reason },
      }),
    onSuccess: () => {
      showToast('Ticket rejected successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      setSelectedTicket(null);
      resetAction();
    },
    onError: (err) => {
      showToast(err.message || 'Failed to reject request.', 'error');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolutionNotes }) =>
      apiFetch(`/maintenance/${id}/resolve`, {
        method: 'PATCH',
        body: { resolutionNotes },
      }),
    onSuccess: () => {
      showToast('Repair marked as resolved successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      setSelectedTicket(null);
      resetAction();
    },
    onError: (err) => {
      showToast(err.message || 'Failed to resolve repair.', 'error');
    },
  });

  // Kanban column definitions
  const columns = [
    {
      id: 'PENDING',
      label: 'Pending Review',
      color: 'border-warning/40 text-[hsl(var(--warning))] bg-warning/5',
    },
    {
      id: 'IN_PROGRESS',
      label: 'In Progress / Assigned',
      color: 'border-primary/40 text-[hsl(var(--primary))] bg-primary/5',
    },
    {
      id: 'RESOLVED',
      label: 'Resolved',
      color: 'border-success/40 text-[hsl(var(--success))] bg-success/5',
    },
    {
      id: 'REJECTED',
      label: 'Rejected',
      color: 'border-destructive/40 text-destructive bg-destructive/5',
    },
  ];

  const getPriorityStyle = (p) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'HIGH':
        return 'bg-warning/15 text-[hsl(var(--warning))] border-warning/30';
      case 'MEDIUM':
        return 'bg-blue-500/15 text-blue-400 border-[hsl(var(--info)/0.30)]';
      default:
        return 'bg-text-muted/15 text-[hsl(var(--text-muted))] border-text-muted/30';
    }
  };

  const getTicketsForColumn = (colId) => {
    return tickets.filter((t) => t.status === colId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[hsl(var(--text-primary))]">
            Maintenance & Repair dispatch
          </h1>
          <p className="text-[hsl(var(--text-secondary))] text-xs">
            Triage and process repair tasks across departments.
          </p>
        </div>
        <button
          onClick={() => setShowRaiseModal(true)}
          className="bg-primary hover:bg-primary-hover text-[hsl(var(--primary))]-foreground font-semibold text-xs py-2 px-4 rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Raise Repair Request
        </button>
      </div>

      {loadingTickets ? (
        <div className="text-center py-20 text-[hsl(var(--text-muted))] text-xs animate-pulse">
          Loading kanban board...
        </div>
      ) : (
        /* Kanban columns container */
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin select-none">
          {columns.map((col) => {
            const colTickets = getTicketsForColumn(col.id);
            return (
              <div key={col.id} className="w-80 shrink-0 flex flex-col gap-4">
                {/* Column header */}
                <div
                  className={`border rounded-lg px-4 py-2.5 flex justify-between items-center ${col.color}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--background))]/50">
                    {colTickets.length}
                  </span>
                </div>

                {/* Column body */}
                <div className="flex flex-col gap-3 min-h-[450px] bg-[hsl(var(--surface))]/10 rounded-lg p-2 border border-[hsl(var(--border))]/20 max-h-[550px] overflow-y-auto">
                  {colTickets.length > 0 ? (
                    colTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="card-elevation p-4 space-y-3 cursor-pointer hover:border-primary/25 hover:translate-y-[-2px] transition-all select-none bg-[hsl(var(--surface))]/50"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-mono text-[9px] font-bold text-[hsl(var(--text-primary))] bg-[hsl(var(--background))] px-1.5 py-0.5 rounded border border-[hsl(var(--border))]">
                            {t.asset.assetTag}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getPriorityStyle(t.priority)}`}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-[hsl(var(--text-primary))] leading-snug">
                          {t.asset.name}
                        </h4>
                        <p className="text-[hsl(var(--text-secondary))] text-xxs line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] text-[hsl(var(--text-muted))] pt-1.5 border-t border-[hsl(var(--border))]/30">
                          <User className="w-3.5 h-3.5" />
                          <span>By: {t.requestedBy.name}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-48 border border-dashed border-[hsl(var(--border))]/40 rounded-lg flex items-center justify-center text-[hsl(var(--text-muted))] text-xxs italic">
                      No tickets
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Details Dialog */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] w-full max-w-lg rounded-lg p-6 space-y-6 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => {
                setSelectedTicket(null);
                resetAction();
              }}
              className="absolute top-4 right-4 p-1.5 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] rounded-md hover:bg-[hsl(var(--surface))]-hover transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xxs font-bold text-[hsl(var(--text-primary))] bg-[hsl(var(--background))] px-2 py-0.5 rounded border border-[hsl(var(--border))]">
                  {selectedTicket.asset.assetTag}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getPriorityStyle(selectedTicket.priority)}`}
                >
                  {selectedTicket.priority}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-[hsl(var(--text-primary))]">
                {selectedTicket.asset.name}
              </h3>
            </div>

            <div className="space-y-4 border-t border-b border-[hsl(var(--border))]/40 py-4 text-xs text-[hsl(var(--text-secondary))]">
              <div className="space-y-1">
                <h4 className="font-semibold text-[hsl(var(--text-primary))]">Issue Description</h4>
                <p className="leading-relaxed bg-[hsl(var(--background))]/50 border border-[hsl(var(--border))]/30 p-3 rounded-md italic">
                  "{selectedTicket.description}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xxs">
                <div>
                  <span className="text-[hsl(var(--text-muted))]">Reported by:</span>
                  <p className="font-medium text-[hsl(var(--text-primary))] mt-0.5">
                    {selectedTicket.requestedBy?.name} ({selectedTicket.requestedBy?.email})
                  </p>
                </div>
                <div>
                  <span className="text-[hsl(var(--text-muted))]">Date Raised:</span>
                  <p className="font-medium text-[hsl(var(--text-primary))] mt-0.5">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedTicket.assignedTo && (
                <div className="text-xxs grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[hsl(var(--text-muted))]">Assigned Technician:</span>
                    <p className="font-medium text-[hsl(var(--primary))] mt-0.5">
                      {selectedTicket.assignedTo.name} ({selectedTicket.assignedTo.email})
                    </p>
                  </div>
                  {selectedTicket.approvedBy && (
                    <div>
                      <span className="text-[hsl(var(--text-muted))]">Approved By:</span>
                      <p className="font-medium text-[hsl(var(--text-primary))] mt-0.5">
                        {selectedTicket.approvedBy.name}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action forms based on status */}
            {selectedTicket.status === 'PENDING' && isManager && (
              <div className="space-y-4">
                <h4 className="font-semibold text-xs text-[hsl(var(--text-primary))]">
                  Dispatch Management
                </h4>

                {/* Approve/Assign form */}
                <form
                  onSubmit={handleSubmitAction((data) =>
                    approveMutation.mutate({
                      id: selectedTicket.id,
                      assignedToId: data.assignedToId,
                    })
                  )}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end border border-primary/20 bg-primary/5 p-4 rounded-lg"
                >
                  <div className="sm:col-span-2 space-y-1">
                    <label
                      className="text-[hsl(var(--text-secondary))] text-xxs font-semibold"
                      htmlFor="tech-select"
                    >
                      Select Technician
                    </label>
                    <select
                      id="tech-select"
                      required
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md px-2 py-1.5 text-xs text-[hsl(var(--text-primary))] focus:outline-none focus:border-primary"
                      {...registerAction('assignedToId')}
                    >
                      <option value="">Choose technician...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={approveMutation.isPending}
                    className="w-full bg-primary hover:bg-primary-hover text-[hsl(var(--primary))]-foreground font-semibold text-xs py-2 rounded-md transition-all cursor-pointer shadow-md shadow-primary/10 h-[32px] flex items-center justify-center"
                  >
                    Approve & Assign
                  </button>
                </form>

                {/* Reject form */}
                <form
                  onSubmit={handleSubmitAction((data) =>
                    rejectMutation.mutate({ id: selectedTicket.id, reason: data.reason })
                  )}
                  className="flex flex-col gap-2 border border-destructive/20 bg-destructive/5 p-4 rounded-lg"
                >
                  <div className="space-y-1">
                    <label
                      className="text-[hsl(var(--text-secondary))] text-xxs font-semibold"
                      htmlFor="reject-reason"
                    >
                      Rejection Reason
                    </label>
                    <textarea
                      id="reject-reason"
                      required
                      rows={2}
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md px-2.5 py-1.5 text-xs text-[hsl(var(--text-primary))] focus:outline-none focus:border-destructive resize-none"
                      placeholder="Input the exact triage rejection reason..."
                      {...registerAction('reason')}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={rejectMutation.isPending}
                    className="self-end bg-destructive hover:bg-destructive-hover text-destructive-foreground font-semibold text-xs py-1.5 px-4 rounded-md transition-all cursor-pointer shadow-md shadow-destructive/10"
                  >
                    Reject Ticket
                  </button>
                </form>
              </div>
            )}

            {selectedTicket.status === 'IN_PROGRESS' &&
              (selectedTicket.assignedToId === user?.id || isManager) && (
                <form
                  onSubmit={handleSubmitAction((data) =>
                    resolveMutation.mutate({
                      id: selectedTicket.id,
                      resolutionNotes: data.resolutionNotes,
                    })
                  )}
                  className="space-y-3 bg-success/5 border border-success/20 p-4 rounded-lg"
                >
                  <h4 className="font-semibold text-xs text-[hsl(var(--success))] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Repair Resolution Logs
                  </h4>
                  <div className="space-y-1">
                    <label
                      className="text-[hsl(var(--text-secondary))] text-xxs font-semibold"
                      htmlFor="resolution-notes"
                    >
                      Completion / Resolution Notes
                    </label>
                    <textarea
                      id="resolution-notes"
                      required
                      rows={2.5}
                      className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md px-2.5 py-1.5 text-xs text-[hsl(var(--text-primary))] focus:outline-none focus:border-success resize-none"
                      placeholder="Detail replacement parts, tests completed, or issues resolved..."
                      {...registerAction('resolutionNotes')}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resolveMutation.isPending}
                    className="w-full bg-success hover:bg-success-hover text-[hsl(var(--success))]-foreground font-semibold text-xs py-2 rounded-md transition-all cursor-pointer shadow-md shadow-success/15"
                  >
                    Mark Repair Resolved
                  </button>
                </form>
              )}

            {/* Resolved / Rejected status summaries */}
            {['RESOLVED', 'REJECTED'].includes(selectedTicket.status) && (
              <div className="p-4 bg-[hsl(var(--surface))]/50 border border-[hsl(var(--border))]/40 rounded-lg space-y-2 text-xxs">
                <span className="font-semibold text-[hsl(var(--text-primary))] uppercase tracking-wider block">
                  {selectedTicket.status === 'RESOLVED' ? 'Resolution Log' : 'Rejection Reason'}
                </span>
                <p className="text-[hsl(var(--text-primary))] italic leading-relaxed bg-[hsl(var(--background))]/50 p-3 border border-[hsl(var(--border))]/20 rounded">
                  "{selectedTicket.resolutionNotes}"
                </p>
                {selectedTicket.completedAt && (
                  <p className="text-[hsl(var(--text-muted))] mt-1">
                    Completed on: {new Date(selectedTicket.completedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raise Repair Modal */}
      {showRaiseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] w-full max-w-md rounded-lg p-6 space-y-6 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setShowRaiseModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-primary))] rounded-md hover:bg-[hsl(var(--surface))]-hover transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-[hsl(var(--text-primary))]">
                Raise Repair Request
              </h3>
              <p className="text-[hsl(var(--text-secondary))] text-xs">
                Report defect details to raise a maintenance dispatch ticket.
              </p>
            </div>

            <form
              onSubmit={handleSubmitRaise((data) => raiseMutation.mutate(data))}
              className="space-y-4"
            >
              {/* Asset Selector */}
              <div className="space-y-1">
                <label
                  className="text-[hsl(var(--text-secondary))] text-xs font-semibold"
                  htmlFor="raise-asset-select"
                >
                  Select Asset
                </label>
                <select
                  id="raise-asset-select"
                  className={`w-full bg-[hsl(var(--background))] border rounded-md px-3 py-2 text-sm text-[hsl(var(--text-primary))] focus:outline focus:border-primary ${
                    raiseErrors.assetId ? 'border-destructive' : 'border-[hsl(var(--border))]'
                  }`}
                  {...registerRaise('assetId', { required: 'Please select the defect asset.' })}
                >
                  <option value="">Choose asset Tag...</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      [{asset.category?.name || 'Category'}] {asset.name} ({asset.assetTag})
                    </option>
                  ))}
                </select>
                {raiseErrors.assetId && (
                  <p className="text-destructive text-xxs font-medium mt-1">
                    {raiseErrors.assetId.message}
                  </p>
                )}
              </div>

              {/* Priority Select */}
              <div className="space-y-1">
                <label
                  className="text-[hsl(var(--text-secondary))] text-xs font-semibold"
                  htmlFor="raise-priority-select"
                >
                  Severity / Priority
                </label>
                <select
                  id="raise-priority-select"
                  className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md px-3 py-2 text-sm text-[hsl(var(--text-primary))] focus:outline focus:border-primary"
                  {...registerRaise('priority')}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label
                  className="text-[hsl(var(--text-secondary))] text-xs font-semibold"
                  htmlFor="raise-desc-input"
                >
                  Defect Description
                </label>
                <textarea
                  id="raise-desc-input"
                  rows={4}
                  className={`w-full bg-[hsl(var(--background))] border rounded-md px-3 py-2 text-sm text-[hsl(var(--text-primary))] focus:outline focus:border-primary resize-none ${
                    raiseErrors.description ? 'border-destructive' : 'border-[hsl(var(--border))]'
                  }`}
                  placeholder="Provide precise defect details (e.g. cracked screen, grinding noises, faulty battery)..."
                  {...registerRaise('description', {
                    required: 'Please input the defect details.',
                    minLength: {
                      value: 5,
                      message: 'Description must be at least 5 characters.',
                    },
                  })}
                />
                {raiseErrors.description && (
                  <p className="text-destructive text-xxs font-medium mt-1">
                    {raiseErrors.description.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={raiseMutation.isPending}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/55 disabled:opacity-50 text-[hsl(var(--primary))]-foreground font-semibold text-sm py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20"
              >
                {raiseMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    <span>Raising repair request...</span>
                  </>
                ) : (
                  'Submit Repair Ticket'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceKanban;
