export const BookingCalendar = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          Shared Resource Bookings
        </h1>
        <p className="text-slate-400 text-xs">
          Schedule meeting rooms, vehicles, and equipment with overlap-free checking.
        </p>
      </div>

      <div className="card-elevation p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">July 2026</span>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-semibold cursor-pointer">
            + Schedule Booking
          </button>
        </div>

        <div className="h-[500px] bg-slate-900/50 rounded flex items-center justify-center text-slate-500 text-xs">
          Calendar schedule grid placeholder
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
