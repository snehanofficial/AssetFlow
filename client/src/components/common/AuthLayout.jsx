import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../ui/Spinner.jsx';

export const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center justify-center gap-4">
        <div
          className="
            w-10 h-10 rounded-xl flex items-center justify-center
            bg-[hsl(var(--primary))]
            font-display font-bold text-[hsl(var(--primary-foreground))] text-lg
          "
          aria-hidden="true"
        >
          A
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner size="md" className="text-[hsl(var(--primary))]" />
          <span className="text-xs text-[hsl(var(--text-muted))] font-medium">
            Verifying session…
          </span>
        </div>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col md:grid md:grid-cols-2 text-[hsl(var(--text-primary))]">
      {/* ── Branding Column ── */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))] relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />

        {/* Brand logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center font-display font-bold text-[hsl(var(--primary-foreground))] text-xl shadow-lg shadow-[hsl(var(--primary)/0.30)]">
            A
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-[hsl(var(--text-primary))]">
            AssetFlow
          </span>
        </div>

        {/* Marketing copy */}
        <div className="space-y-8 relative z-10">
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-extrabold tracking-tight leading-tight text-[hsl(var(--text-primary))]">
              Enterprise Asset &<br />
              Resource Management.
            </h1>
            <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed max-w-sm">
              Digitize your organization's complete asset lifecycle — from registration to
              decommission.
            </p>
          </div>

          {/* Feature highlights */}
          <ul className="space-y-3" aria-label="Key features">
            {[
              { emoji: '📦', text: 'Track custody, condition, and location of every asset' },
              {
                emoji: '📅',
                text: 'Coordinate shared resource reservations with conflict detection',
              },
              { emoji: '🔍', text: 'Run structured audits and generate compliance reports' },
            ].map(({ emoji, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="text-base leading-none mt-0.5" aria-hidden="true">
                  {emoji}
                </span>
                <span className="text-xs text-[hsl(var(--text-secondary))] leading-relaxed">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-[hsl(var(--text-muted))] font-medium relative z-10">
          © 2026 AssetFlow Corp. All rights reserved.
        </p>
      </div>

      {/* ── Form Column ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile brand mark */}
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center font-display font-bold text-[hsl(var(--primary-foreground))] text-base">
              A
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-[hsl(var(--text-primary))]">
              AssetFlow
            </span>
          </div>

          {/* Form card */}
          <div className="card p-8 space-y-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
