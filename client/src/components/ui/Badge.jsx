/**
 * Badge — Semantic status tags.
 *
 * Variants: success | warning | danger | info | primary | muted
 *
 * Usage:
 *   <Badge variant="success">Available</Badge>
 *   <Badge variant="danger" dot>Lost</Badge>
 */

const variantClasses = {
  success:
    'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.30)]',
  warning:
    'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.30)]',
  danger: 'bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))] border-[hsl(var(--danger)/0.30)]',
  info: 'bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))] border-[hsl(var(--info)/0.30)]',
  primary:
    'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary-hover))] border-[hsl(var(--primary)/0.25)]',
  muted: 'bg-[hsl(var(--surface-hover))] text-[hsl(var(--text-muted))] border-[hsl(var(--border))]',
};

export const Badge = ({ variant = 'muted', dot = false, children, className = '', ...props }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5
        rounded
        text-[11px] font-semibold
        leading-normal whitespace-nowrap
        border
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
      )}
      {children}
    </span>
  );
};

/**
 * Maps Asset Status enum values to Badge variant + label.
 */
export const STATUS_BADGE_MAP = {
  AVAILABLE: { variant: 'success', label: 'Available' },
  ALLOCATED: { variant: 'info', label: 'Allocated' },
  UNDER_MAINTENANCE: { variant: 'warning', label: 'Maintenance' },
  RESERVED: { variant: 'warning', label: 'Reserved' },
  LOST: { variant: 'danger', label: 'Lost' },
  RETIRED: { variant: 'muted', label: 'Retired' },
  DISPOSED: { variant: 'muted', label: 'Disposed' },
};

export const AssetStatusBadge = ({ status, className = '' }) => {
  const config = STATUS_BADGE_MAP[status] ?? { variant: 'muted', label: status };
  return (
    <Badge
      variant={config.variant}
      dot
      className={className}
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
};

/**
 * Maps Maintenance Priority enum values to Badge variant.
 */
export const PRIORITY_BADGE_MAP = {
  LOW: { variant: 'muted', label: 'Low' },
  MEDIUM: { variant: 'info', label: 'Medium' },
  HIGH: { variant: 'warning', label: 'High' },
  CRITICAL: { variant: 'danger', label: 'Critical' },
};

export const PriorityBadge = ({ priority, className = '' }) => {
  const config = PRIORITY_BADGE_MAP[priority] ?? { variant: 'muted', label: priority };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

export default Badge;
