/**
 * Input — Unified form input component.
 *
 * Usage:
 *   <Input
 *     label="Asset Name"
 *     id="name"
 *     placeholder="e.g. Dell Latitude 5520"
 *     error={errors.name?.message}
 *     required
 *     {...register('name')}
 *   />
 */
import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = forwardRef(function Input(
  {
    label,
    id,
    error,
    hint,
    required = false,
    disabled = false,
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    className = '',
    containerClassName = '',
    labelClassName = '',
    ...props
  },
  ref
) {
  const inputId = id || props.name;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`text-xs font-medium text-[hsl(var(--text-secondary))] ${labelClassName}`}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-[hsl(var(--danger))]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative flex items-center">
        {LeadingIcon && (
          <LeadingIcon
            className="absolute left-3 w-4 h-4 text-[hsl(var(--text-muted))] pointer-events-none"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          aria-required={required}
          className={`
            w-full
            h-9
            bg-[hsl(var(--background))]
            border rounded-lg
            px-3 py-2
            text-sm text-[hsl(var(--text-primary))]
            placeholder:text-[hsl(var(--text-muted))]
            transition-all duration-150
            outline-none
            focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-[hsl(var(--ring))]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[hsl(var(--surface))]
            ${
              error
                ? 'border-[hsl(var(--danger))] focus:ring-[hsl(var(--danger)/0.40)] bg-[hsl(var(--danger)/0.04)]'
                : 'border-[hsl(var(--border))]'
            }
            ${LeadingIcon ? 'pl-9' : ''}
            ${TrailingIcon || error ? 'pr-9' : ''}
            ${className}
          `}
          {...props}
        />
        {TrailingIcon && !error && (
          <TrailingIcon
            className="absolute right-3 w-4 h-4 text-[hsl(var(--text-muted))] pointer-events-none"
            aria-hidden="true"
          />
        )}
        {error && (
          <AlertCircle
            className="absolute right-3 w-4 h-4 text-[hsl(var(--danger))] pointer-events-none"
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

export default Input;
