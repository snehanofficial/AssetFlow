import { Router } from 'express';
import multer from 'multer';
import prisma from '../../database/client.js';
import authenticateSession from '../../middlewares/auth.middleware.js';
import authorizeRoles from '../../middlewares/authorization.middleware.js';
import { logMutation } from '../../services/audit.service.js';
import storage from '../../services/storage/index.js';
import {
  createAssetSchema,
  updateAssetSchema,
  listAssetsQuerySchema,
  updateAssetStatusSchema,
} from './asset.validators.js';
import {
  createAsset,
  listAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  updateAssetStatus,
} from './asset.service.js';

const router = Router();

router.use(authenticateSession);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
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

router.post(
  '/',
  authorizeRoles('ADMIN', 'ASSET_MANAGER'),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      const validated = createAssetSchema.parse(req.body);

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

router.get('/', async (req, res, next) => {
  try {
    const hasDirectoryQuery =
      req.query.page !== undefined ||
      req.query.limit !== undefined ||
      req.query.search !== undefined ||
      req.query.categoryId !== undefined ||
      req.query.status !== undefined ||
      req.query.departmentId !== undefined ||
      req.query.location !== undefined;

    if (hasDirectoryQuery) {
      const query = listAssetsQuerySchema.parse(req.query);
      const result = await listAssets(query, req.user);

      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    const where = { deletedAt: null };
    if (req.query.isBookable === 'true') {
      where.isBookable = true;
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const asset = await getAssetById(req.params.id, req.user);

    return res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
});

router.put(
  '/:id',
  authorizeRoles('ADMIN', 'ASSET_MANAGER'),
  upload.single('photo'),
  async (req, res, next) => {
    try {
      const validated = updateAssetSchema.parse(req.body);

      let photoUrl;
      if (req.file) {
        const uploaded = await storage.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        photoUrl = uploaded.url;
      }

      const { before, asset } = await updateAsset(req.params.id, validated, photoUrl);

      await logMutation({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'UPDATE',
        tableName: 'Asset',
        recordId: asset.id,
        oldValue: before,
        newValue: asset,
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', authorizeRoles('ADMIN', 'ASSET_MANAGER'), async (req, res, next) => {
  try {
    const { before, asset } = await deleteAsset(req.params.id);

    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'DELETE',
      tableName: 'Asset',
      recordId: asset.id,
      oldValue: before,
      newValue: asset,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Asset deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

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
