import { Router } from 'express';
import prisma from '../../database/client.js';
import authenticateSession from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateSession);

router.get('/', async (req, res, next) => {
  try {
    const { role, departmentId, id: userId } = req.user;

    const whereAsset = { deletedAt: null };
    const whereAlloc = { status: 'ACTIVE' };
    const whereBook = { status: { in: ['UPCOMING', 'ONGOING'] } };
    const whereMaint = { status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] } };

    if (role === 'DEPT_HEAD') {
      if (departmentId) {
        whereAsset.allocations = {
          some: {
            status: 'ACTIVE',
            employee: { departmentId },
          },
        };
        whereAlloc.employee = { departmentId };
        whereBook.bookedBy = { departmentId };
        whereMaint.requestedBy = { departmentId };
      }
    } else if (role === 'EMPLOYEE') {
      whereAsset.allocations = {
        some: {
          status: 'ACTIVE',
          employeeId: userId,
        },
      };
      whereAlloc.employeeId = userId;
      whereBook.bookedById = userId;
      whereMaint.requestedById = userId;
    }

    const [totalAssets, activeAllocations, scheduledBookings, openRepairs] = await Promise.all([
      prisma.asset.count({ where: whereAsset }),
      prisma.assetAllocation.count({ where: whereAlloc }),
      prisma.booking.count({ where: whereBook }),
      prisma.maintenanceRequest.count({ where: whereMaint }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalAssets,
        activeAllocations,
        scheduledBookings,
        openRepairs,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
