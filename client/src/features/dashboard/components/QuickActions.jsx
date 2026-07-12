import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Wrench } from 'lucide-react';
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
            color: 'border-primary/30 hover:border-primary text-primary bg-primary/5',
            onClick: () => navigate('/assets?action=new'),
          },
        ]
      : []),
    {
      title: 'Book Resource',
      description: 'Reserve a bookable shared asset',
      icon: Calendar,
      color: 'border-success/30 hover:border-success text-success bg-success/5',
      onClick: () => navigate('/bookings'),
    },
    {
      title: 'Raise Repair',
      description: 'Report a defect or raise maintenance',
      icon: Wrench,
      color: 'border-warning/30 hover:border-warning text-warning bg-warning/5',
      onClick: () => navigate('/maintenance?action=new'),
    },
  ];

  return (
    <div className="card-elevation p-6 space-y-4">
      <h3 className="font-display font-bold text-sm text-text-primary">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={action.onClick}
              className={`w-full text-left border rounded-lg p-3 flex items-start gap-3 transition-all duration-200 cursor-pointer hover:translate-x-1 ${action.color}`}
            >
              <div className="p-2 rounded bg-background/50">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-text-primary">{action.title}</h4>
                <p className="text-text-muted text-xxs mt-0.5">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
