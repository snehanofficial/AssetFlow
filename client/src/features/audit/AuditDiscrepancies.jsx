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
      <div className="border border-[hsl(var(--success)/0.20)] bg-[hsl(var(--success)/0.05)] rounded-lg p-6 text-center space-y-2">
        <ShieldCheck className="w-8 h-8 text-[hsl(var(--success))] mx-auto" />
        <h4 className="font-semibold text-[hsl(var(--text-primary))] text-xs">
          No Discrepancies Found
        </h4>
        <p className="text-[hsl(var(--text-secondary))] text-xxs leading-relaxed">
          All audited assets in this scope were verified successfully in on-site locations.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[hsl(var(--border)/0.80)] rounded-lg overflow-hidden bg-[hsl(var(--surface))]">
      {/* Panel Header */}
      <div className="bg-[hsl(var(--surface))]/50 border-b border-[hsl(var(--border))] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--danger))]" />
          <h4 className="font-bold text-xs text-[hsl(var(--text-primary))]">
            Compliance Discrepancies Log ({discrepancies.length})
          </h4>
        </div>
        <span className="text-[10px] text-[hsl(var(--text-secondary))] bg-[hsl(var(--background))] px-2.5 py-0.5 rounded border border-[hsl(var(--border))]">
          {isClosed ? 'Locked & Reconciled' : 'Draft Reconciliation'}
        </span>
      </div>

      {/* Discrepancies list */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xxs">
          <thead>
            <tr className="border-b border-[hsl(var(--border)/0.60)] bg-[hsl(var(--background))] text-[hsl(var(--text-secondary))]">
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
                <tr
                  key={item.id}
                  className="hover:bg-[hsl(var(--surface))]-hover/30 transition-all"
                >
                  {/* Asset Tag */}
                  <td className="p-3 font-mono font-bold text-[hsl(var(--text-primary))] whitespace-nowrap">
                    {item.asset?.assetTag || 'N/A'}
                  </td>
                  {/* Asset Name */}
                  <td className="p-3 text-[hsl(var(--text-primary))] font-medium">
                    {item.asset?.name || 'N/A'}
                  </td>
                  {/* Audited Status badge */}
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 border rounded text-[9px] font-bold ${
                        isMissing
                          ? 'bg-[hsl(var(--danger)/0.10)] text-[hsl(var(--danger))] border-[hsl(var(--danger))]/20'
                          : 'bg-[hsl(var(--warning)/0.10)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.20)]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  {/* Observations */}
                  <td className="p-3 text-[hsl(var(--text-secondary))] leading-relaxed max-w-xs truncate">
                    {item.notes || (
                      <span className="text-[hsl(var(--text-muted))]/60 italic">
                        No notes recorded
                      </span>
                    )}
                  </td>
                  {/* Action on Close */}
                  <td className="p-3">
                    {isClosed ? (
                      <div className="flex items-center gap-1.5 text-[hsl(var(--text-primary))]">
                        {isMissing ? (
                          <>
                            <HelpCircle className="w-3.5 h-3.5 text-[hsl(var(--danger))] shrink-0" />
                            <span>Cascaded status to LOST</span>
                          </>
                        ) : (
                          <>
                            <Hammer className="w-3.5 h-3.5 text-[hsl(var(--warning))] shrink-0" />
                            <span>Dispatched Repair Ticket</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-[hsl(var(--text-muted))] italic">
                        Pending cycle closure
                      </span>
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
