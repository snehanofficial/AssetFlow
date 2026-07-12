import prisma from '../../database/client.js';
import { validateBookingOverlap } from './booking.lifecycle.js';
import { logMutation } from '../../services/audit.service.js';
import { publishNotification } from '../notifications/notification.service.js';

/**
 * Fetch list of bookings with optional query filters.
 *
 * @param {Object} filters
 * @param {string} [filters.assetId]
 * @param {string} [filters.startDate]
 * @param {string} [filters.endDate]
 * @returns {Promise<Array>} List of bookings.
 */
export async function listBookings(filters = {}) {
  const { assetId, startDate, endDate } = filters;
  const where = {
    // Only return bookings that are not cancelled by default
    status: {
      in: ['UPCOMING', 'ONGOING', 'COMPLETED'],
    },
  };

  if (assetId) {
    where.assetId = assetId;
  }

  // Range checks: return bookings that overlap with the range if both are set
  if (startDate || endDate) {
    where.AND = [];
    if (startDate) {
      where.AND.push({
        endDate: {
          gte: new Date(startDate),
        },
      });
    }
    if (endDate) {
      where.AND.push({
        startDate: {
          lte: new Date(endDate),
        },
      });
    }
  }

  return await prisma.booking.findMany({
    where,
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          assetTag: true,
        },
      },
      bookedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  });
}

/**
 * Creates a new resource booking after validating overlaps in a transaction.
 *
 * @param {Object} params
 * @param {string} params.assetId
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @param {string} [params.notes]
 * @param {Object} params.user
 * @param {string} [params.ipAddress]
 * @returns {Promise<Object>} The created booking.
 */
export async function createBooking({ assetId, startDate, endDate, notes, user, ipAddress }) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const newBooking = await prisma.$transaction(async (tx) => {
    // 1. Run validation lifecycle (checks block overlaps and isBookable status)
    await validateBookingOverlap(tx, { assetId, startDate: start, endDate: end });

    // 2. Create the booking record
    return await tx.booking.create({
      data: {
        assetId,
        bookedById: user.id,
        startDate: start,
        endDate: end,
        notes,
        status: 'UPCOMING',
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
          },
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });

  // 3. Log mutation event
  await logMutation({
    actorId: user.id,
    actorEmail: user.email,
    action: 'INSERT',
    tableName: 'Booking',
    recordId: newBooking.id,
    newValue: newBooking,
    ipAddress,
  });

  // Publish booking confirmation notification
  await publishNotification({
    employeeId: user.id,
    type: 'BOOKING_CONFIRMED',
    title: 'Booking Confirmed',
    message: `You successfully reserved ${newBooking.asset.name} (${newBooking.asset.assetTag}) starting ${new Date(
      newBooking.startDate
    ).toLocaleString()}.`,
    linkUrl: '/bookings',
  }).catch(() => {});

  return newBooking;
}

/**
 * Soft cancels an active booking. Validates user authorization.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {Object} params.user
 * @param {string} [params.ipAddress]
 * @returns {Promise<Object>} The updated booking record.
 */
export async function cancelBooking({ id, user, ipAddress }) {
  const cancelled = await prisma.$transaction(async (tx) => {
    // 1. Find the booking
    const booking = await tx.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      const error = new Error('Booking not found.');
      error.code = 'BOOKING_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify authorization
    const isOwner = booking.bookedById === user.id;
    const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(user.role);

    if (!isOwner && !isManager) {
      const error = new Error('You are not authorized to cancel this booking.');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }

    if (booking.status === 'CANCELLED') {
      const error = new Error('This booking is already cancelled.');
      error.code = 'ALREADY_CANCELLED';
      error.statusCode = 400;
      throw error;
    }

    // 3. Update status
    return await tx.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            assetTag: true,
          },
        },
        bookedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  });

  // 4. Log mutation event
  await logMutation({
    actorId: user.id,
    actorEmail: user.email,
    action: 'UPDATE',
    tableName: 'Booking',
    recordId: cancelled.id,
    oldValue: { id: cancelled.id, status: 'UPCOMING' },
    newValue: { id: cancelled.id, status: 'CANCELLED' },
    ipAddress,
  });

  // Publish booking cancellation notification
  await publishNotification({
    employeeId: cancelled.bookedById,
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    message: `Your booking for ${cancelled.asset.name} (${cancelled.asset.assetTag}) has been cancelled.`,
    linkUrl: '/bookings',
  }).catch(() => {});

  return cancelled;
}
