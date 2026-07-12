import { Router } from 'express';
import multer from 'multer';
import authenticateSession from '../../middlewares/auth.middleware.js';
import authorizeRoles from '../../middlewares/authorization.middleware.js';
import { logMutation } from '../../services/audit.service.js';
import storage from '../../services/storage/index.js';
import {
  createAssetSchema,
  listAssetsQuerySchema,
  updateAssetStatusSchema,
} from './asset.validators.js';
import { createAsset, listAssets, getAssetById, updateAssetStatus } from './asset.service.js';

const router = Router();

// All routes require authentication
router.use(authenticateSession);

// Multer: in-memory buffer storage, 5MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(
        Object.assign(new Error('Only image files are accepted.'), {
          status: 400,
          code: 'INVALID_FILE_TYPE',
        }),
        false
      );
    }
    cb(null, true);
  },
});

/**
 * POST /api/v1/assets
 * Register a new asset. Requires ADMIN or ASSET_MANAGER role.
 * Supports optional multipart photo upload.
 */
router.post(
  '/',
  authorizeRoles('ADMIN', 'ASSET_MANAGER'),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      // Parse and validate body (handles both JSON and multipart string fields)
      const validated = createAssetSchema.parse(req.body);

      // Handle optional photo upload
      let photoUrl = null;
      if (req.file) {
        const uploaded = await storage.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        photoUrl = uploaded.url;
      }

      const asset = await createAsset(validated, photoUrl);

      // Audit log
      await logMutation({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'INSERT',
        tableName: 'Asset',
        recordId: asset.id,
        newValue: asset,
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/assets
 * List assets with pagination, search, and filters.
 * ADMIN, ASSET_MANAGER, DEPT_HEAD only.
 * DEPT_HEAD sees only department assets.
 */
router.get('/', authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'), async (req, res, next) => {
  try {
    const query = listAssetsQuerySchema.parse(req.query);
    const result = await listAssets(query, req.user);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/assets/:id
 * Retrieve full asset detail with timeline history.
 * ADMIN, ASSET_MANAGER, DEPT_HEAD only.
 */
router.get(
  '/:id',
  authorizeRoles('ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'),
  async (req, res, next) => {
    try {
      const asset = await getAssetById(req.params.id, req.user);

      return res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/assets/:id/status
 * Manually update asset status. Enforces lifecycle transitions.
 * ADMIN, ASSET_MANAGER only.
 */
router.patch('/:id/status', authorizeRoles('ADMIN', 'ASSET_MANAGER'), async (req, res, next) => {
  try {
    const { status } = updateAssetStatusSchema.parse(req.body);
    const asset = await updateAssetStatus(req.params.id, status, req.user);

    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'UPDATE',
      tableName: 'Asset',
      recordId: asset.id,
      newValue: { status: asset.status },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
