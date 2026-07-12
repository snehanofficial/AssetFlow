/**
 * Select — Styled native select matching Input design.
 *
 * Usage:
 *   <Select
 *     label="Status"
 *     id="status"
 *     error={errors.status?.message}
 *     {...register('status')}
 *   >
 *     <option value="">All Statuses</option>
 *     <option value="AVAILABLE">Available</option>
 *   </Select>
 */
import { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export const Select = forwardRef(function Select(
  {
    label,
    id,
    error,
    hint,
    required = false,
    disabled = false,
    className = '',
    containerClassName = '',
    children,
    ...props
  },
  ref
) {
  const selectId = id || props.name;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-[hsl(var(--text-secondary))]">
          {label}
          {required && (
            <span className="ml-0.5 text-[hsl(var(--danger))]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          aria-required={required}
          className={`
            w-full
            h-9
            appearance-none
            bg-[hsl(var(--background))]
            border rounded-lg
            px-3 pr-9 py-2
            text-sm text-[hsl(var(--text-primary))]
            transition-all duration-150
            outline-none
            cursor-pointer
            focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-[hsl(var(--ring))]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[hsl(var(--surface))]
            ${
              error
                ? 'border-[hsl(var(--danger))] focus:ring-[hsl(var(--danger)/0.40)]'
                : 'border-[hsl(var(--border))]'
            }
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute right-3 w-4 h-4 text-[hsl(var(--text-muted))] pointer-events-none"
          aria-hidden="true"
        />
        {error && (
          <AlertCircle
            className="absolute right-8 w-4 h-4 text-[hsl(var(--danger))] pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="text-[11px] text-[hsl(var(--text-muted))]">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 text-[11px] text-[hsl(var(--danger))] font-medium"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default Select;
