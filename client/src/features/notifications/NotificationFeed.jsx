export const NotificationFeed = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">Notifications</h1>
        <p className="text-slate-400 text-xs">
          Stay updated on asset assignments, transfers, and overdue warnings.
        </p>
      </div>

      <div className="card-elevation p-6 h-96 flex items-center justify-center text-slate-500 text-xs">
        No new notifications
      </div>
    </div>
  );
};

export default NotificationFeed;
