/**
 * Textarea — Styled textarea matching Input design.
 */
import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export const Textarea = forwardRef(function Textarea(
  {
    label,
    id,
    error,
    hint,
    required = false,
    disabled = false,
    rows = 3,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const textareaId = id || props.name;
  const errorId = error ? `${textareaId}-error` : undefined;
  const hintId = hint ? `${textareaId}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-medium text-[hsl(var(--text-secondary))]"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-[hsl(var(--danger))]" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          aria-required={required}
          className={`
            w-full
            bg-[hsl(var(--background))]
            border rounded-lg
            px-3 py-2.5
            text-sm text-[hsl(var(--text-primary))]
            placeholder:text-[hsl(var(--text-muted))]
            transition-all duration-150
            outline-none
            resize-y min-h-[80px]
            focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-[hsl(var(--ring))]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[hsl(var(--surface))]
            ${
              error
                ? 'border-[hsl(var(--danger))] focus:ring-[hsl(var(--danger)/0.40)] bg-[hsl(var(--danger)/0.04)]'
                : 'border-[hsl(var(--border))]'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <AlertCircle
            className="absolute right-3 top-3 w-4 h-4 text-[hsl(var(--danger))] pointer-events-none"
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

export default Textarea;
