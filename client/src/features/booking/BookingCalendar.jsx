import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import apiFetch from '../../utils/api.js';
import { useToast } from '../../components/common/Providers.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Calendar, Clock, User, X, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

export const BookingCalendar = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Calendar states
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch bookable assets for dropdown
  const { data: assetsResponse } = useQuery({
    queryKey: ['assets', 'bookable'],
    queryFn: () => apiFetch('/assets?isBookable=true'),
  });
  const bookableAssets = assetsResponse?.data || [];

  // Fetch bookings based on selected filters
  const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: ['bookings', selectedAssetId],
    queryFn: () => apiFetch(selectedAssetId ? `/bookings?assetId=${selectedAssetId}` : '/bookings'),
  });
  const bookings = bookingsResponse?.data || [];

  // React Hook Form for booking creation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      assetId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
    },
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (newBooking) =>
      apiFetch('/bookings', {
        method: 'POST',
        body: newBooking,
      }),
    onSuccess: () => {
      showToast('Booking successfully scheduled!', 'success');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
      setShowCreateModal(false);
      reset();
    },
    onError: (err) => {
      showToast(err.message || 'Failed to schedule booking.', 'error');
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: (id) =>
      apiFetch(`/bookings/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      showToast('Booking cancelled successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] });
    },
    onError: (err) => {
      showToast(err.message || 'Failed to cancel booking.', 'error');
    },
  });

  const onSubmit = (data) => {
    // Construct ISO dates in local browser timezone
    const startStr = `${data.date}T${data.startTime}:00`;
    const endStr = `${data.date}T${data.endTime}:00`;

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    if (endDate <= startDate) {
      showToast('End time must be after start time.', 'error');
      return;
    }

    createBookingMutation.mutate({
      assetId: data.assetId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      notes: data.notes,
    });
  };

  // Helper calculations for calendar rendering
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Filter bookings that fall on a specific date
  const getBookingsForDate = (d) => {
    const targetDateStr = new Date(year, month, d).toDateString();
    return bookings.filter(
      (b) => new Date(b.startDate).toDateString() === targetDateStr
    );
  };

  const activeDayBookings = bookings.filter(
    (b) => new Date(b.startDate).toDateString() === selectedDate.toDateString()
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
            Shared Resource Bookings
          </h1>
          <p className="text-text-secondary text-xs">
            Schedule meeting rooms, vehicles, and equipment with overlap-free checking.
          </p>
        </div>
        <button
          onClick={() => {
            if (bookableAssets.length === 0) {
              showToast('No bookable resources available in registry.', 'warning');
              return;
            }
            setShowCreateModal(true);
          }}
          className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs py-2 px-4 rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto shadow-lg shadow-primary/20"
        >
          <Calendar className="w-4 h-4" />
          Schedule Booking
        </button>
      </div>

      {/* Filter and Quick info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border p-4 rounded-lg">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label htmlFor="asset-filter" className="text-text-secondary text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
            Filter Resource:
          </label>
          <select
            id="asset-filter"
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="bg-background border border-border text-text-primary text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-primary max-w-xs"
          >
            <option value="">All Bookable Resources</option>
            {bookableAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.assetTag})
              </option>
            ))}
          </select>
        </div>

        <div className="text-text-muted text-xxs font-semibold">
          💡 Adjacent slots ending exactly when another starts are allowed.
        </div>
      </div>

      {/* Main Grid Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Calendar View */}
        <div className="card-elevation p-6 lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-bold text-sm text-text-primary">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 border border-border rounded-md hover:bg-surface-hover text-text-primary transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 border border-border rounded-md hover:bg-surface-hover text-text-primary transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Days of week */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day} className="text-text-muted text-xxs font-bold uppercase py-2">
                {day}
              </span>
            ))}

            {/* Previous Month Padding */}
            {[...Array(firstDayIndex)].map((_, idx) => {
              const prevD = prevMonthTotalDays - firstDayIndex + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="h-24 bg-background/20 border border-border/10 text-text-muted/40 text-xxs p-1.5 text-left rounded-md cursor-not-allowed"
                >
                  {prevD}
                </div>
              );
            })}

            {/* Actual Days */}
            {[...Array(totalDays)].map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(year, month, day);
              const isSelected = dateObj.toDateString() === selectedDate.toDateString();
              const isToday = dateObj.toDateString() === new Date().toDateString();
              const dayBookings = getBookingsForDate(day);

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateObj)}
                  className={`h-24 border text-left p-1.5 rounded-md flex flex-col justify-between transition-all cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 bg-background/50 hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xxs font-bold px-1.5 py-0.5 rounded ${
                        isToday
                          ? 'bg-primary text-primary-foreground'
                          : isSelected
                          ? 'text-primary'
                          : 'text-text-primary'
                      }`}
                    >
                      {day}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    )}
                  </div>

                  {/* List bookings summary inside cell */}
                  <div className="space-y-1 overflow-y-auto max-h-12 scrollbar-none">
                    {dayBookings.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="text-[9px] truncate bg-surface px-1 py-0.5 rounded border border-border/40 text-text-secondary leading-tight"
                      >
                        {b.asset.name}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-[8px] text-text-muted font-medium text-center">
                        +{dayBookings.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Bookings Detail Panel */}
        <div className="card-elevation p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-sm text-text-primary">
              Bookings Schedule
            </h3>
            <p className="text-text-secondary text-xxs font-medium">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="text-center py-8 text-text-muted text-xs animate-pulse">
                Loading schedules...
              </div>
            ) : activeDayBookings.length > 0 ? (
              activeDayBookings.map((b) => {
                const isBooker = b.bookedById === user?.id;
                const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(user?.role);
                const showCancel = isBooker || isManager;

                return (
                  <div
                    key={b.id}
                    className="p-4 bg-background border border-border/80 rounded-lg space-y-3 shadow-sm hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-text-primary bg-surface px-2 py-0.5 rounded border border-border">
                          {b.asset.assetTag}
                        </span>
                        <h4 className="font-bold text-xs text-text-primary mt-1.5">
                          {b.asset.name}
                        </h4>
                      </div>
                      {showCancel && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this booking?')) {
                              cancelBookingMutation.mutate(b.id);
                            }
                          }}
                          disabled={cancelBookingMutation.isPending}
                          className="p-1 text-text-muted hover:text-destructive hover:bg-destructive/10 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1 text-xxs text-text-secondary border-t border-border/40 pt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        <span>
                          {new Date(b.startDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(b.endDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                        <span>Booked by: {b.bookedBy.name}</span>
                      </div>
                    </div>

                    {b.notes && (
                      <p className="text-xxs text-text-muted bg-surface/50 border border-border/30 p-2 rounded leading-relaxed italic">
                        "{b.notes}"
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="h-48 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-muted text-xs p-4 text-center">
                <span>No Bookings Scheduled</span>
                <span className="text-xxs text-text-muted/70 mt-1">
                  Click "+ Schedule Booking" to block this date slot.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Booking Form Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface border border-border w-full max-w-md rounded-lg p-6 space-y-6 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-hover transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-text-primary">
                Schedule New Booking
              </h3>
              <p className="text-text-secondary text-xs">
                Check conflicts and reserve a bookable shared asset.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Asset Selector */}
              <div className="space-y-1">
                <label className="text-text-secondary text-xs font-semibold" htmlFor="modal-asset-select">
                  Select Resource
                </label>
                <select
                  id="modal-asset-select"
                  className={`w-full bg-background border rounded-md px-3 py-2 text-sm text-text-primary focus:outline focus:border-primary ${
                    errors.assetId ? 'border-destructive' : 'border-border'
                  }`}
                  {...register('assetId', { required: 'Please select a resource to book.' })}
                >
                  <option value="">Choose bookable asset...</option>
                  {bookableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      [{asset.category.name}] {asset.name} ({asset.assetTag})
                    </option>
                  ))}
                </select>
                {errors.assetId && (
                  <p className="text-destructive text-xxs font-medium mt-1">
                    {errors.assetId.message}
                  </p>
                )}
              </div>

              {/* Date Input */}
              <div className="space-y-1">
                <label className="text-text-secondary text-xs font-semibold" htmlFor="modal-date-input">
                  Date
                </label>
                <input
                  id="modal-date-input"
                  type="date"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline focus:border-primary"
                  {...register('date', { required: 'Date is required.' })}
                />
              </div>

              {/* Time Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-text-secondary text-xs font-semibold" htmlFor="modal-start-time">
                    Start Time
                  </label>
                  <input
                    id="modal-start-time"
                    type="time"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline focus:border-primary"
                    {...register('startTime', { required: 'Start time is required.' })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-text-secondary text-xs font-semibold" htmlFor="modal-end-time">
                    End Time
                  </label>
                  <input
                    id="modal-end-time"
                    type="time"
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline focus:border-primary"
                    {...register('endTime', { required: 'End time is required.' })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-text-secondary text-xs font-semibold" htmlFor="modal-notes-input">
                  Notes
                </label>
                <textarea
                  id="modal-notes-input"
                  rows={3}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline focus:border-primary resize-none"
                  placeholder="Booking purpose, external attendees, setup needs..."
                  {...register('notes')}
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={createBookingMutation.isPending}
                className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/55 disabled:opacity-50 text-primary-foreground font-semibold text-sm py-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    <span>Checking conflicts & booking...</span>
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
