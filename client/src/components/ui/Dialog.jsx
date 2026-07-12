/**
 * Dialog — Reusable accessible modal/dialog.
 *
 * Usage:
 *   <Dialog
 *     open={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Delete Asset"
 *     size="md"
 *   >
 *     <p>Are you sure?</p>
 *     <Dialog.Footer>
 *       <Button variant="outline" onClick={onClose}>Cancel</Button>
 *       <Button variant="danger" onClick={onConfirm}>Delete</Button>
 *     </Dialog.Footer>
 *   </Dialog>
 */
import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.jsx';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
};

export const Dialog = ({
  open,
  onClose,
  title,
  description,
  size = 'md',
  hideCloseButton = false,
  children,
  className = '',
}) => {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Store previous focus and manage focus trap
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      // Focus the dialog after mount
      const timer = setTimeout(() => {
        dialogRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    } else {
      // Restore focus when closing
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [open]);

  // Keyboard: Escape closes dialog
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose?.();
      }
    },
    [onClose]
  );

  if (!open) return null;

  const titleId = title ? 'dialog-title' : undefined;
  const descId = description ? 'dialog-desc' : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overlay-backdrop"
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className={`
          relative
          w-full
          card-elevated
          shadow-2xl
          outline-none
          animate-[modal-in_200ms_cubic-bezier(0.16,1,0.3,1)_both]
          ${sizeClasses[size]}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[hsl(var(--border))]">
            <div className="space-y-0.5">
              {title && (
                <h2 id={titleId} className="text-sm font-semibold text-[hsl(var(--text-primary))]">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="text-xs text-[hsl(var(--text-secondary))]">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <Button
                variant="ghost"
                iconOnly
                size="sm"
                onClick={onClose}
                aria-label="Close dialog"
                className="flex-shrink-0 -mr-1 -mt-0.5"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

/**
 * Dialog.Footer — Standard action footer for dialogs.
 */
Dialog.Footer = function DialogFooter({ children, className = '' }) {
  return (
    <div
      className={`flex items-center justify-end gap-3 pt-4 mt-2 border-t border-[hsl(var(--border))] ${className}`}
    >
      {children}
    </div>
  );
};

export default Dialog;
