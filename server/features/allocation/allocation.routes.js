import { Router } from 'express';
import authenticateSession from '../../middlewares/auth.middleware.js';
import authorizeRoles from '../../middlewares/authorization.middleware.js';
import { logMutation } from '../../services/audit.service.js';
import {
  createAllocationSchema,
  returnAssetSchema,
  createTransferSchema,
  updateTransferStatusSchema,
} from './allocation.validators.js';
import { allocateAsset, returnAsset, listAllocations } from './allocation.service.js';
import {
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
  listTransferRequests,
} from './transfer.service.js';

const router = Router();

// All routes require authentication
router.use(authenticateSession);

/**
 * GET /api/v1/allocations
 * List allocations. ADMIN, ASSET_MANAGER, DEPT_HEAD.
 * Query: status?, employeeId?, assetId?, page, limit
 */
router.get('/', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'), async (req, res, next) => {
  try {
    const result = await listAllocations(req.query, req.user);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/allocations
 * Allocate an asset to an employee.
 * ADMIN, ASSET_MANAGER, DEPT_HEAD.
 */
router.post('/', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'), async (req, res, next) => {
  try {
    const validated = createAllocationSchema.parse(req.body);
    const allocation = await allocateAsset(validated, req.user);

    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'INSERT',
      tableName: 'AssetAllocation',
      recordId: allocation.id,
      newValue: allocation,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: allocation });
  } catch (error) {
    // Pass through double-allocation error with enriched data
    if (error.code === 'ASSET_ALREADY_ALLOCATED') {
      return res.status(409).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          currentHolder: error.currentHolder || null,
        },
      });
    }
    next(error);
  }
});

/**
 * POST /api/v1/allocations/:id/return
 * Check in a returned asset.
 * ADMIN, ASSET_MANAGER, DEPT_HEAD.
 */
router.post(
  '/:id/return',
  authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'),
  async (req, res, next) => {
    try {
      const validated = returnAssetSchema.parse(req.body);
      const allocation = await returnAsset(req.params.id, validated, req.user);

      await logMutation({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'UPDATE',
        tableName: 'AssetAllocation',
        recordId: allocation.id,
        newValue: { status: allocation.status, returnedAt: allocation.returnedAt },
        ipAddress: req.ip,
      });

      return res.status(200).json({ success: true, data: allocation });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/allocations/transfers
 * List transfer requests.
 * ADMIN, ASSET_MANAGER, DEPT_HEAD.
 */
router.get(
  '/transfers',
  authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'),
  async (req, res, next) => {
    try {
      const result = await listTransferRequests(req.query, req.user);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/allocations/transfers
 * Initiate a transfer request for an allocated asset.
 * All authenticated roles (EMPLOYEE can request their own transfers).
 */
router.post('/transfers', async (req, res, next) => {
  try {
    const validated = createTransferSchema.parse(req.body);
    const transfer = await createTransferRequest(validated, req.user);

    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'INSERT',
      tableName: 'TransferRequest',
      recordId: transfer.id,
      newValue: transfer,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/allocations/transfers/:id/status
 * Approve or reject a pending transfer request.
 * ADMIN, ASSET_MANAGER, DEPT_HEAD.
 */
router.patch(
  '/transfers/:id/status',
  authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'),
  async (req, res, next) => {
    try {
      const validated = updateTransferStatusSchema.parse(req.body);

      let result;
      if (validated.status === 'APPROVED') {
        result = await approveTransferRequest(req.params.id, req.user);

        await logMutation({
          actorId: req.user.id,
          actorEmail: req.user.email,
          action: 'UPDATE',
          tableName: 'TransferRequest',
          recordId: req.params.id,
          newValue: { status: 'APPROVED' },
          ipAddress: req.ip,
        });
      } else {
        result = await rejectTransferRequest(
          req.params.id,
          { rejectReason: validated.rejectReason },
          req.user
        );

        await logMutation({
          actorId: req.user.id,
          actorEmail: req.user.email,
          action: 'UPDATE',
          tableName: 'TransferRequest',
          recordId: req.params.id,
          newValue: { status: 'REJECTED' },
          ipAddress: req.ip,
        });
      }

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
