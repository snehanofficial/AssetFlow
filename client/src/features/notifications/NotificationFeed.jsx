import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../../utils/api.js';
import { useToast } from '../../components/common/Providers.jsx';
import {
  Bell,
  Calendar,
  Wrench,
  ShieldAlert,
  ClipboardList,
  MailOpen,
  ArrowRight,
  Clock,
  Circle,
} from 'lucide-react';

export const NotificationFeed = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // 1. Fetch personal notifications list
  const { data: response, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => apiFetch('/notifications'),
    refetchInterval: 15000, // Refresh inbox logs every 15 seconds
  });

  const notifications = response?.data?.notifications || [];
  const unreadCount = response?.data?.unreadCount || 0;

  // 2. Mutations
  const readOneMutation = useMutation({
    mutationFn: (id) =>
      apiFetch(`/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: () =>
      apiFetch('/notifications/read-all', {
        method: 'PATCH',
      }),
    onSuccess: () => {
      showToast('All notifications marked as read.', 'success');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err) => {
      showToast(err.message || 'Failed to update notifications.', 'error');
    },
  });

  const handleCardClick = (item) => {
    // Mark as read if unread
    if (item.status === 'UNREAD') {
      readOneMutation.mutate(item.id);
    }
    // Navigate if link exists
    if (item.linkUrl) {
      navigate(item.linkUrl);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
      case 'BOOKING_CANCELLED':
      case 'BOOKING_REMINDER':
        return Calendar;
      case 'MAINTENANCE_APPROVED':
      case 'MAINTENANCE_REJECTED':
      case 'MAINTENANCE_RESOLVED':
        return Wrench;
      case 'AUDIT_ASSIGNED':
      case 'AUDIT_DISCREPANCY':
        return ClipboardList;
      case 'OVERDUE_RETURN':
        return ShieldAlert;
      default:
        return Bell;
    }
  };

  const getIconColor = (type) => {
    if (type.includes('CANCELLED') || type.includes('REJECTED') || type === 'OVERDUE_RETURN') {
      return 'text-destructive bg-destructive/10 border-destructive/20';
    }
    if (type.includes('CONFIRMED') || type.includes('RESOLVED') || type.includes('APPROVED')) {
      return 'text-success bg-success/10 border-success/20';
    }
    return 'text-primary bg-primary/10 border-primary/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
            Notification Feed
          </h1>
          <p className="text-text-secondary text-xs">
            Stay updated on active asset assignments, transfers, bookings, and audits.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            className="text-text-primary hover:text-primary border border-border hover:border-primary/20 bg-surface px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <MailOpen className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-text-muted text-xs animate-pulse">
          Loading notifications feed...
        </div>
      ) : notifications.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 max-w-3xl">
          {notifications.map((item) => {
            const Icon = getNotificationIcon(item.type);
            const isUnread = item.status === 'UNREAD';

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`group border rounded-lg p-4 flex gap-4 transition-all duration-200 cursor-pointer ${
                  isUnread
                    ? 'bg-primary/5 border-primary/30 hover:border-primary'
                    : 'bg-surface/50 border-border/50 hover:bg-surface-hover/80'
                }`}
              >
                {/* Icon wrapper */}
                <div className={`p-2.5 rounded-md border shrink-0 h-10 w-10 flex items-center justify-center ${getIconColor(item.type)}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`text-xs font-bold truncate leading-snug ${isUnread ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {isUnread && (
                        <Circle className="w-2 h-2 fill-primary text-primary" />
                      )}
                      <span className="text-text-muted text-[10px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-text-secondary text-xxs leading-relaxed pr-6">{item.message}</p>
                </div>

                {/* Action shortcut chevron */}
                {item.linkUrl && (
                  <div className="flex items-center self-center pl-2">
                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-elevation p-12 text-center text-text-muted text-xs border border-dashed border-border rounded-lg max-w-3xl flex flex-col items-center justify-center space-y-3">
          <Bell className="w-8 h-8 text-text-muted opacity-60" />
          <p className="font-medium">All caught up!</p>
          <span className="text-xxs text-text-muted/75">You have no unread notifications or messages.</span>
        </div>
      )}
    </div>
  );
};

export default NotificationFeed;
