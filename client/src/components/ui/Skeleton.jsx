/**
 * Skeleton — Loading placeholder components.
 *
 * Usage:
 *   <Skeleton className="h-8 w-48" />          — single line
 *   <SkeletonText lines={3} />                  — multiple lines
 *   <SkeletonCard />                            — card block
 *   <SkeletonTableRows rows={6} columns={5} />  — table rows
 *   <SkeletonStatCards count={4} />             — stat card grid
 */

/**
 * Base skeleton element
 */
export const Skeleton = ({ className = '' }) => (
  <div aria-hidden="true" className={`skeleton rounded ${className}`} />
);

/**
 * Multiple text lines skeleton
 */
export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} />
    ))}
  </div>
);

/**
 * Card-shaped skeleton
 */
export const SkeletonCard = ({ className = '' }) => (
  <div className={`card p-5 space-y-3 ${className}`} aria-hidden="true">
    <div className="flex items-center gap-3">
      <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
    <Skeleton className="h-8 w-20" />
    <Skeleton className="h-2.5 w-32" />
  </div>
);

/**
 * Stat card skeleton
 */
export const SkeletonStatCard = ({ className = '' }) => (
  <div className={`card p-6 flex items-center justify-between ${className}`} aria-hidden="true">
    <div className="space-y-2 flex-1">
      <Skeleton className="h-2.5 w-28" />
      <Skeleton className="h-7 w-16" />
      <Skeleton className="h-2 w-36" />
    </div>
    <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
  </div>
);

/**
 * Grid of skeleton stat cards
 */
export const SkeletonStatCards = ({ count = 4, className = '' }) => (
  <div
    className={`grid grid-cols-2 gap-4 lg:grid-cols-4 ${className}`}
    aria-hidden="true"
    aria-label="Loading metrics"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonStatCard key={i} />
    ))}
  </div>
);

/**
 * Table rows skeleton — shows placeholder rows matching real row height
 */
export const SkeletonTableRows = ({ rows = 8, columns = 5 }) => (
  <tbody aria-hidden="true" aria-label="Loading table data">
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <tr key={rowIdx} className="border-b border-[hsl(var(--border-subtle))]">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <td key={colIdx} className="px-4 py-3">
            <Skeleton
              className={`h-3 ${
                colIdx === 0
                  ? 'w-20'
                  : colIdx === 1
                    ? 'w-36'
                    : colIdx === columns - 1
                      ? 'w-14'
                      : 'w-24'
              }`}
            />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

/**
 * Full table skeleton including header
 */
export const SkeletonTable = ({ rows = 8, columns = 5, columnLabels = [] }) => (
  <div className="card overflow-hidden" aria-busy="true" aria-label="Loading">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-subtle))]">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="table-header-cell">
                {columnLabels[i] ? (
                  <span className="text-[hsl(var(--text-muted))]">{columnLabels[i]}</span>
                ) : (
                  <Skeleton className="h-2.5 w-16" />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <SkeletonTableRows rows={rows} columns={columns} />
      </table>
    </div>
  </div>
);

/**
 * Page-level loading skeleton for Dashboard
 */
export const SkeletonDashboard = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-3 w-64" />
    </div>
    {/* Stat cards */}
    <SkeletonStatCards count={4} />
    {/* Chart panels */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card p-6 space-y-4 lg:col-span-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
      <div className="space-y-4">
        <div className="card p-6 space-y-3">
          <Skeleton className="h-4 w-32" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Skeleton;
