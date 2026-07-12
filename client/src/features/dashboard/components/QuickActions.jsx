import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Wrench, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';

export const QuickActions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(user.role);

  const actions = [
    ...(isManager
      ? [
          {
            title: 'Register Asset',
            description: 'Add a new asset to the registry',
            icon: Plus,
            className:
              'border-[hsl(var(--primary)/0.25)] hover:border-[hsl(var(--primary)/0.60)] text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)] hover:bg-[hsl(var(--primary)/0.08)]',
            onClick: () => navigate('/assets?action=new'),
          },
        ]
      : []),
    {
      title: 'Book Resource',
      description: 'Reserve a bookable shared asset',
      icon: Calendar,
      className:
        'border-[hsl(var(--success)/0.25)] hover:border-[hsl(var(--success)/0.60)] text-[hsl(var(--success))] bg-[hsl(var(--success)/0.05)] hover:bg-[hsl(var(--success)/0.08)]',
      onClick: () => navigate('/bookings'),
    },
    {
      title: 'Report Repair',
      description: 'Report a defect or raise a ticket',
      icon: Wrench,
      className:
        'border-[hsl(var(--warning)/0.25)] hover:border-[hsl(var(--warning)/0.60)] text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.05)] hover:bg-[hsl(var(--warning)/0.08)]',
      onClick: () => navigate('/maintenance?action=new'),
    },
  ];

  return (
    <div className="card p-5 space-y-3">
      <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))]">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              onClick={action.onClick}
              className={`
                w-full text-left border rounded-lg p-3
                flex items-center gap-3
                transition-all duration-150 cursor-pointer
                group
                ${action.className}
              `}
            >
              <div className="p-1.5 rounded-md bg-current/10 flex-shrink-0" aria-hidden="true">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-[hsl(var(--text-primary))]">
                  {action.title}
                </p>
                <p className="text-[11px] text-[hsl(var(--text-muted))] mt-0.5">
                  {action.description}
                </p>
              </div>
              <ArrowRight
                className="w-3.5 h-3.5 text-[hsl(var(--text-muted))] flex-shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-150"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
