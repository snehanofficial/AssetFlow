import { Router } from 'express';
import authenticateSession from '../../middlewares/auth.middleware.js';
import { getDashboardMetrics } from './dashboard.service.js';
import prisma from '../../database/client.js';

const router = Router();
router.use(authenticateSession);


/**
 * GET /api/v1/dashboard/metrics
 * Fetches KPIs and warning indicators (overdue assets).
 */
router.get('/metrics', authenticateSession, async (req, res, next) => {
  try {
    const metrics = await getDashboardMetrics(req.user);
    return res.status(200).json({
      success: true,
      data: metrics,

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
