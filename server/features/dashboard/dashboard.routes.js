import { Router } from 'express';
import authenticateSession from '../../middlewares/auth.middleware.js';
import { getDashboardMetrics } from './dashboard.service.js';

const router = Router();

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
    });
  } catch (error) {
    next(error);
  }
});

export default router;
