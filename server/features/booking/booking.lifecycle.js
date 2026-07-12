/**
 * Check if the asset is bookable and block overlapping bookings.
 * Overlap check: requestedStart < existingEnd AND requestedEnd > existingStart
 *
 * @param {Object} tx - The active Prisma transaction client
 * @param {Object} params
 * @param {string} params.assetId
 * @param {Date} params.startDate
 * @param {Date} params.endDate
 * @param {string} [params.ignoreBookingId] - Ignore specific booking ID during updates
 */
export async function validateBookingOverlap(tx, { assetId, startDate, endDate, ignoreBookingId }) {
  // 1. Verify if the asset exists and is bookable
  const asset = await tx.asset.findUnique({
    where: { id: assetId },
  });

  if (!asset || asset.deletedAt !== null) {
    const error = new Error('The selected asset does not exist.');
    error.code = 'ASSET_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  if (!asset.isBookable) {
    const error = new Error('This asset is not configured for resource booking.');
    error.code = 'ASSET_NOT_BOOKABLE';
    error.statusCode = 400;
    throw error;
  }

  // 2. Query for overlapping bookings (excluding CANCELLED bookings)
  const query = {
    assetId,
    status: {
      in: ['UPCOMING', 'ONGOING'],
    },
    startDate: {
      lt: endDate,
    },
    endDate: {
      gt: startDate,
    },
  };

  if (ignoreBookingId) {
    query.id = {
      not: ignoreBookingId,
    };
  }

  const overlap = await tx.booking.findFirst({
    where: query,
    include: {
      bookedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (overlap) {
    const error = new Error(
      `Booking conflict: Already booked by ${overlap.bookedBy.name} (${overlap.bookedBy.email}) from ${new Date(
        overlap.startDate
      ).toLocaleTimeString()} to ${new Date(overlap.endDate).toLocaleTimeString()}.`
    );
    error.code = 'BOOKING_CONFLICT';
    error.statusCode = 400;
    throw error;
  }
}
