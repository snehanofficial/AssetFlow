/**
 * Alert — Inline alert banners for page-level feedback.
 *
 * Variants: info | success | warning | danger
 *
 * Usage:
 *   <Alert variant="danger" title="Failed to load">
 *     Server connection error. <button>Retry</button>
 *   </Alert>
 */
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const variantConfig = {
  info: {
    icon: Info,
    containerClass:
      'bg-[hsl(var(--info)/0.08)] border-[hsl(var(--info)/0.25)] text-[hsl(var(--info))]',
    titleClass: 'text-[hsl(var(--info))]',
    bodyClass: 'text-[hsl(var(--info)/0.85)]',
  },
  success: {
    icon: CheckCircle2,
    containerClass:
      'bg-[hsl(var(--success)/0.08)] border-[hsl(var(--success)/0.25)] text-[hsl(var(--success))]',
    titleClass: 'text-[hsl(var(--success))]',
    bodyClass: 'text-[hsl(var(--success)/0.85)]',
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      'bg-[hsl(var(--warning)/0.08)] border-[hsl(var(--warning)/0.25)] text-[hsl(var(--warning))]',
    titleClass: 'text-[hsl(var(--warning))]',
    bodyClass: 'text-[hsl(var(--warning)/0.80)]',
  },
  danger: {
    icon: XCircle,
    containerClass:
      'bg-[hsl(var(--danger)/0.08)] border-[hsl(var(--danger)/0.25)] text-[hsl(var(--danger))]',
    titleClass: 'text-[hsl(var(--danger))]',
    bodyClass: 'text-[hsl(var(--danger)/0.85)]',
  },
};

export const Alert = ({ variant = 'info', title, children, className = '' }) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role={variant === 'danger' ? 'alert' : 'status'}
      className={`
        flex gap-3 p-4 rounded-lg border
        ${config.containerClass}
        ${className}
      `}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className={`text-xs font-semibold mb-0.5 ${config.titleClass}`}>{title}</p>}
        {children && (
          <div className={`text-xs leading-relaxed ${config.bodyClass}`}>{children}</div>
        )}
      </div>
    </div>
  );
};

export default Alert;
