import { AlertTriangle, ShieldCheck, Hammer, HelpCircle } from 'lucide-react';

/**
 * AuditDiscrepancies renders a premium summary grid of all verified discrepancies
 * (items marked as MISSING or DAMAGED) in a compliance cycle.
 *
 * @param {Object} props
 * @param {Array} props.items - Scoped cycle items
 * @param {boolean} props.isClosed - Whether the parent audit cycle is CLOSED
 */
export const AuditDiscrepancies = ({ items = [], isClosed = false }) => {
  // Filter for discrepancies (status is MISSING or DAMAGED)
  const discrepancies = items.filter((item) => ['MISSING', 'DAMAGED'].includes(item.status));

  if (discrepancies.length === 0) {
    return (
      <div className="border border-success/20 bg-success/5 rounded-lg p-6 text-center space-y-2">
        <ShieldCheck className="w-8 h-8 text-success mx-auto" />
        <h4 className="font-semibold text-text-primary text-xs">No Discrepancies Found</h4>
        <p className="text-text-secondary text-xxs leading-relaxed">
          All audited assets in this scope were verified successfully in on-site locations.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border/80 rounded-lg overflow-hidden bg-surface">
      {/* Panel Header */}
      <div className="bg-surface/50 border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h4 className="font-bold text-xs text-text-primary">
            Compliance Discrepancies Log ({discrepancies.length})
          </h4>
        </div>
        <span className="text-[10px] text-text-secondary bg-background px-2.5 py-0.5 rounded border border-border">
          {isClosed ? 'Locked & Reconciled' : 'Draft Reconciliation'}
        </span>
      </div>

      {/* Discrepancies list */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xxs">
          <thead>
            <tr className="border-b border-border/60 bg-background text-text-secondary">
              <th className="p-3 font-semibold">Asset Tag</th>
              <th className="p-3 font-semibold">Asset Name</th>
              <th className="p-3 font-semibold">Audited Status</th>
              <th className="p-3 font-semibold">Auditor Observations</th>
              <th className="p-3 font-semibold">Reconciliation Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {discrepancies.map((item) => {
              const isMissing = item.status === 'MISSING';
              return (
                <tr key={item.id} className="hover:bg-surface-hover/30 transition-all">
                  {/* Asset Tag */}
                  <td className="p-3 font-mono font-bold text-text-primary whitespace-nowrap">
                    {item.asset?.assetTag || 'N/A'}
                  </td>
                  {/* Asset Name */}
                  <td className="p-3 text-text-primary font-medium">{item.asset?.name || 'N/A'}</td>
                  {/* Audited Status badge */}
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 border rounded text-[9px] font-bold ${
                        isMissing
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  {/* Observations */}
                  <td className="p-3 text-text-secondary leading-relaxed max-w-xs truncate">
                    {item.notes || <span className="text-text-muted/60 italic">No notes recorded</span>}
                  </td>
                  {/* Action on Close */}
                  <td className="p-3">
                    {isClosed ? (
                      <div className="flex items-center gap-1.5 text-text-primary">
                        {isMissing ? (
                          <>
                            <HelpCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                            <span>Cascaded status to LOST</span>
                          </>
                        ) : (
                          <>
                            <Hammer className="w-3.5 h-3.5 text-warning shrink-0" />
                            <span>Dispatched Repair Ticket</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-muted italic">Pending cycle closure</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditDiscrepancies;
