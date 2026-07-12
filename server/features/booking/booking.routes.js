import { Router } from 'express';
import authenticateSession from '../../middlewares/auth.middleware.js';
import { createBookingSchema } from './booking.validators.js';
import { listBookings, createBooking, cancelBooking } from './booking.service.js';

const router = Router();

/**
 * GET /api/v1/bookings
 * Lists bookings with filters (assetId, startDate, endDate).
 */
router.get('/', authenticateSession, async (req, res, next) => {
  try {
    const filters = {
      assetId: req.query.assetId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const bookings = await listBookings(filters);

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/bookings
 * Creates a new resource booking after validating conflicts.
 */
router.post('/', authenticateSession, async (req, res, next) => {
  try {
    const validated = createBookingSchema.parse(req.body);

    const booking = await createBooking({
      ...validated,
      user: req.user,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed.',
          details: error.errors,
        },
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    next(error);
  }
});

/**
 * DELETE /api/v1/bookings/:id
 * Cancels a resource booking.
 */
router.delete('/:id', authenticateSession, async (req, res, next) => {
  try {
    const booking = await cancelBooking({
      id: req.params.id,
      user: req.user,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    next(error);
  }
});

export default router;
