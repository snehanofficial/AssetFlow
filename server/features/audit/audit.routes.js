import { Router } from 'express';
import { z } from 'zod';
import authenticateSession from '../../middlewares/auth.middleware.js';
import {
  listAuditCycles,
  getAuditCycle,
  createAuditCycle,
  updateAuditItem,
  closeAuditCycle,
} from './audit.service.js';

const router = Router();

// Zod schemas
const createAuditSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters long.'),
  scopeType: z.enum(['department', 'location']),
  scopeValue: z.string().trim().min(1, 'Scope value is required.'),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'End date must be a valid date.')
    .refine((val) => new Date(val) > new Date(), 'End date must be in the future.'),
  auditorIds: z
    .array(z.string().uuid('Invalid auditor ID format.'))
    .min(1, 'At least one auditor is required.'),
});

const updateItemSchema = z.object({
  status: z.enum(['VERIFIED', 'MISSING', 'DAMAGED']),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters.').optional().nullable(),
});

/**
 * GET /api/v1/audits
 * Lists all audit cycles.
 */
router.get('/', authenticateSession, async (req, res, next) => {
  try {
    const cycles = await listAuditCycles(req.user);

    return res.status(200).json({
      success: true,
      data: cycles,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/audits/:id
 * Fetches details of a specific audit cycle.
 */
router.get('/:id', authenticateSession, async (req, res, next) => {
  try {
    const cycle = await getAuditCycle(req.params.id);

    if (!cycle) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AUDIT_NOT_FOUND',
          message: 'Audit cycle not found.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: cycle,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/audits
 * Initializes a new physical verification cycle.
 */
router.post('/', authenticateSession, async (req, res, next) => {
  try {
    const validated = createAuditSchema.parse(req.body);

    const cycle = await createAuditCycle({
      ...validated,
      user: req.user,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: cycle,
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
 * PATCH /api/v1/audits/items/:id
 * Updates verification state of an audit item.
 */
router.patch('/items/:id', authenticateSession, async (req, res, next) => {
  try {
    const validated = updateItemSchema.parse(req.body);

    const item = await updateAuditItem({
      itemId: req.params.id,
      ...validated,
      user: req.user,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Audit item updated successfully.',
      data: item,
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
 * POST /api/v1/audits/:id/close
 * Closes audit cycle and locks records.
 */
router.post('/:id/close', authenticateSession, async (req, res, next) => {
  try {
    const cycle = await closeAuditCycle({
      id: req.params.id,
      user: req.user,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Audit cycle closed and locked successfully.',
      data: cycle,
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
