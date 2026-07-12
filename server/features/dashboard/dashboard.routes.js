import { Router } from 'express';
import authenticateSession from '../../middlewares/auth.middleware.js';
import { getDashboardMetrics } from './dashboard.service.js';

const router = Router();

router.use(authenticateSession);

async function handleDashboardMetrics(req, res, next) {
  try {
    const metrics = await getDashboardMetrics(req.user);

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/dashboard
 * GET /api/v1/dashboard/metrics
 * GET /api/v1/dashboard/kpis
 * Return role-scoped dashboard KPIs.
 */
router.get('/', handleDashboardMetrics);
router.get('/metrics', handleDashboardMetrics);
router.get('/kpis', handleDashboardMetrics);

export default router;
