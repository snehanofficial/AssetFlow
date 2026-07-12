/**
 * Button — Unified button component.
 *
 * Variants: primary | secondary | outline | ghost | danger | link
 * Sizes:    sm | md | lg
 *
 * Usage:
 *   <Button variant="primary" size="md" onClick={handler}>Save</Button>
 *   <Button variant="primary" isLoading>Saving...</Button>
 *   <Button variant="ghost" size="sm" aria-label="Refresh"><RefreshCw size={14} /></Button>
 */
import { forwardRef } from 'react';
import { Spinner } from './Spinner.jsx';

const variantClasses = {
  primary:
    'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))] active:bg-[hsl(var(--primary-active))] border-transparent shadow-sm',
  secondary:
    'bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))] border-[hsl(var(--border))]',
  outline:
    'bg-transparent text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface))] border-[hsl(var(--border))]',
  ghost:
    'bg-transparent text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-primary))] border-transparent',
  danger:
    'bg-[hsl(var(--danger)/0.10)] text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)/0.18)] border-[hsl(var(--danger)/0.30)] active:bg-[hsl(var(--danger)/0.25)]',
  link: 'bg-transparent text-[hsl(var(--primary))] hover:underline border-transparent p-0 h-auto font-medium',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
};

const iconSizeClasses = {
  sm: 'h-8 w-8 p-0',
  md: 'h-9 w-9 p-0',
  lg: 'h-10 w-10 p-0',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    iconOnly = false,
    disabled = false,
    children,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`
        inline-flex items-center justify-center
        font-medium
        border rounded-lg
        cursor-pointer
        select-none
        transition-all duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        ${iconOnly ? iconSizeClasses[size] : sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" className="opacity-80" />
          {!iconOnly && <span>{children}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;
