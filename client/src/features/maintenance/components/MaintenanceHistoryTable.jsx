import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export const MaintenanceHistoryTable = ({ maintenance = [] }) => {
  const getPriorityStyle = (p) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'HIGH':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-text-muted/10 text-text-muted border-text-muted/20';
    }
  };

  const getStatusStyle = (s) => {
    switch (s) {
      case 'RESOLVED':
        return {
          color: 'bg-success/10 text-success border-success/20',
          icon: CheckCircle,
        };
      case 'REJECTED':
        return {
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: XCircle,
        };
      case 'IN_PROGRESS':
        return {
          color: 'bg-primary/10 text-primary border-primary/20',
          icon: Clock,
        };
      default:
        return {
          color: 'bg-warning/10 text-warning border-warning/20',
          icon: AlertCircle,
        };
    }
  };

  if (maintenance.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-xs border border-dashed border-border rounded-lg">
        No maintenance history logged for this asset.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full border border-border rounded-lg bg-surface/50">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-background/50 text-text-secondary font-semibold uppercase tracking-wider text-xxs">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Requester</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Technician</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Resolution Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {maintenance.map((ticket) => {
            const statusConfig = getStatusStyle(ticket.status);
            const StatusIcon = statusConfig.icon;

            return (
              <tr key={ticket.id} className="hover:bg-surface-hover/50 text-text-secondary">
                <td className="px-4 py-3.5 whitespace-nowrap">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3.5 font-medium text-text-primary">
                  {ticket.requestedBy?.name || 'Unknown'}
                  <div className="text-[10px] text-text-muted font-normal mt-0.5">
                    {ticket.requestedBy?.email}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityStyle(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-4 py-3.5 max-w-xs break-words leading-relaxed">
                  {ticket.description}
                </td>
                <td className="px-4 py-3.5">
                  {ticket.assignedTo ? (
                    <div>
                      <p className="font-medium text-text-primary">{ticket.assignedTo.name}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">{ticket.assignedTo.email}</p>
                    </div>
                  ) : (
                    <span className="text-text-muted italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5 leading-relaxed">
                  {ticket.resolutionNotes ? (
                    <div className="space-y-1">
                      <p className="text-text-primary italic font-medium">"{ticket.resolutionNotes}"</p>
                      {ticket.completedAt && (
                        <p className="text-[10px] text-text-muted">
                          Resolved at: {new Date(ticket.completedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-text-muted italic">No logs yet</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MaintenanceHistoryTable;
