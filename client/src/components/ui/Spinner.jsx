/**
 * Spinner — Unified loading indicator.
 * Sizes: sm (16px), md (20px), lg (28px)
 */
const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-5 h-5 border-2',
  lg: 'w-7 h-7 border-[3px]',
};

export const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`
        rounded-full
        border-current
        border-t-transparent
        animate-spin
        ${sizeClasses[size]}
        ${className}
      `}
      style={{ animationDuration: '0.75s' }}
    />
  );
};

export default Spinner;
