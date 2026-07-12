import { Router } from 'express';
import authenticateSession from '../../middlewares/auth.middleware.js';
import { getSummaryAnalytics, exportDataStream } from './reports.service.js';

const router = Router();

// Middleware to restrict reports to Admin & Asset Manager
const requireManagerAccess = (req, res, next) => {
  const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(req.user.role);
  if (!isManager) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only Administrators and Asset Managers can access Reports and Analytics.',
      },
    });
  }
  next();
};

/**
 * GET /api/v1/reports/summary
 * Returns JSON aggregation logs (Category Utilization, Maintenance pie counts, Bookings schedule heatmaps).
 */
router.get('/summary', authenticateSession, requireManagerAccess, async (req, res, next) => {
  try {
    const summary = await getSummaryAnalytics();

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/export
 * Triggers CSV file downloads for assets, bookings, or maintenance logs.
 */
router.get('/export', authenticateSession, requireManagerAccess, async (req, res, next) => {
  try {
    const { type } = req.query;

    const { csvContent, filename } = await exportDataStream({ type });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    return res.status(200).send(csvContent);
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
