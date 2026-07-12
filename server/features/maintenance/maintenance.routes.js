import { Router } from 'express';
import { z } from 'zod';
import authenticateSession from '../../middlewares/auth.middleware.js';
import {
  listMaintenanceRequests,
  raiseMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  resolveMaintenanceRequest,
} from './maintenance.service.js';

const router = Router();

// Zod validation schemas
const raiseRequestSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID format.'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters long.'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

const approveRequestSchema = z.object({
  assignedToId: z.string().uuid('Invalid technician ID format.'),
});

const rejectRequestSchema = z.object({
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters long.'),
});

const resolveRequestSchema = z.object({
  resolutionNotes: z.string().trim().min(5, 'Resolution notes must be at least 5 characters long.'),
});

/**
 * GET /api/v1/maintenance
 * Lists maintenance requests with optional filters.
 */
router.get('/', authenticateSession, async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      assetId: req.query.assetId,
    };

    const requests = await listMaintenanceRequests(filters);

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/maintenance
 * Raises a new repair request for an asset.
 */
router.post('/', authenticateSession, async (req, res, next) => {
  try {
    const validated = raiseRequestSchema.parse(req.body);

    const request = await raiseMaintenanceRequest({
      ...validated,
      user: req.user,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: request,
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
 * PATCH /api/v1/maintenance/:id/approve
 * Approves a request and assigns a technician.
 */
router.patch('/:id/approve', authenticateSession, async (req, res, next) => {
  try {
    const validated = approveRequestSchema.parse(req.body);

    const request = await approveMaintenanceRequest({
      id: req.params.id,
      assignedToId: validated.assignedToId,
      user: req.user,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Maintenance request approved and assigned successfully.',
      data: request,
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
 * PATCH /api/v1/maintenance/:id/reject
 * Rejects a repair request with a reason.
 */
router.patch('/:id/reject', authenticateSession, async (req, res, next) => {
  try {
    const validated = rejectRequestSchema.parse(req.body);

    const request = await rejectMaintenanceRequest({
      id: req.params.id,
      reason: validated.reason,
      user: req.user,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Maintenance request rejected successfully.',
      data: request,
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
 * PATCH /api/v1/maintenance/:id/resolve
 * Resolves a repair task with completion notes.
 */
router.patch('/:id/resolve', authenticateSession, async (req, res, next) => {
  try {
    const validated = resolveRequestSchema.parse(req.body);

    const request = await resolveMaintenanceRequest({
      id: req.params.id,
      resolutionNotes: validated.resolutionNotes,
      user: req.user,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Maintenance request resolved successfully.',
      data: request,
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

export default router;
