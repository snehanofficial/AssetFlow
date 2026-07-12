import { Router } from 'express';
import prisma from '../../database/client.js';

const router = Router();

/**
 * GET /api/v1/assets
 * Minimal listing endpoint supporting isBookable filter to unblock bookings calendar.
 */
router.get('/', async (req, res, next) => {
  try {
    const { isBookable } = req.query;
    const where = { deletedAt: null };

    if (isBookable === 'true') {
      where.isBookable = true;
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: {
          select: {
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

/**
 * GET /api/v1/assets/:id
 * Fetches asset details with historical maintenance tickets.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id, deletedAt: null },
      include: {
        category: true,
        maintenance: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
            requestedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSET_NOT_FOUND',
          message: 'Asset not found.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
