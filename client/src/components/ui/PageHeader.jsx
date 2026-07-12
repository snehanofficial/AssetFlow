/**
 * PageHeader — Consistent page-level header section.
 *
 * Usage:
 *   <PageHeader
 *     title="Asset Directory"
 *     description="456 assets registered"
 *     icon={Package}
 *   >
 *     <Button variant="primary">Register Asset</Button>
 *   </PageHeader>
 */

export const PageHeader = ({ title, description, icon: Icon, children, className = '' }) => {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="space-y-1 min-w-0">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[hsl(var(--text-primary))] font-display">
          {Icon && (
            <Icon className="w-6 h-6 text-[hsl(var(--primary))] flex-shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{title}</span>
        </h1>
        {description && (
          <p className="text-xs text-[hsl(var(--text-secondary))] pl-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
};

/**
 * SectionHeader — For card/section-level headings (h3 level).
 */
export const SectionHeader = ({ title, description, icon: Icon, children, className = '' }) => {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="space-y-0.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[hsl(var(--text-primary))]">
          {Icon && (
            <Icon className="w-4 h-4 text-[hsl(var(--text-secondary))]" aria-hidden="true" />
          )}
          {title}
        </h3>
        {description && <p className="text-xs text-[hsl(var(--text-muted))]">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};

export default PageHeader;
