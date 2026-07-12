/**
 * EmptyState — Standardized empty state component.
 *
 * Usage:
 *   <EmptyState
 *     icon={Package}
 *     title="No assets registered yet"
 *     description="Register your organization's assets to track custody and condition."
 *   >
 *     <Button variant="primary" onClick={onRegister}>Register Asset</Button>
 *   </EmptyState>
 */

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  children,
  className = '',
  compact = false,
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${compact ? 'py-10 px-6' : 'py-16 px-8'}
        ${className}
      `}
    >
      {Icon && (
        <div
          className={`
            flex items-center justify-center rounded-xl
            ${
              compact
                ? 'w-10 h-10 mb-3 bg-[hsl(var(--surface-hover))]'
                : 'w-14 h-14 mb-4 bg-[hsl(var(--surface-hover))]'
            }
          `}
          aria-hidden="true"
        >
          <Icon
            className={`
              text-[hsl(var(--text-muted))]
              ${compact ? 'w-5 h-5' : 'w-7 h-7'}
            `}
          />
        </div>
      )}

      {title && (
        <h3
          className={`
            font-semibold text-[hsl(var(--text-primary))]
            ${compact ? 'text-sm mb-1' : 'text-sm mb-1.5'}
          `}
        >
          {title}
        </h3>
      )}

      {description && (
        <p
          className={`
            text-[hsl(var(--text-muted))] max-w-xs mx-auto leading-relaxed
            ${compact ? 'text-xs' : 'text-xs mb-5'}
          `}
        >
          {description}
        </p>
      )}

      {children && <div className={compact ? 'mt-3' : 'mt-5'}>{children}</div>}
    </div>
  );
};

/**
 * FilterEmptyState — Specific pattern for filter no-results.
 */
export const FilterEmptyState = ({ onClear, className = '' }) => (
  <EmptyState
    icon={({ className: cn }) => (
      <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
        <path d="M8 11h6M11 8v6" strokeLinecap="round" />
      </svg>
    )}
    title="No results match your filters"
    description="Try adjusting or clearing your filters to find what you're looking for."
    className={className}
  >
    {onClear && (
      <button
        onClick={onClear}
        className="text-xs font-medium text-[hsl(var(--primary))] hover:underline"
      >
        Clear all filters
      </button>
    )}
  </EmptyState>
);

export default EmptyState;
