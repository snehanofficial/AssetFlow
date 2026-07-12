import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes.js';
import adminRoutes from '../features/admin/admin.routes.js';
import organizationRoutes from '../features/organization/organization.routes.js';
import assetRoutes from '../features/assets/asset.routes.js';
import allocationRoutes from '../features/allocation/allocation.routes.js';
import bookingRoutes from '../features/booking/booking.routes.js';
import maintenanceRoutes from '../features/maintenance/maintenance.routes.js';
import auditRoutes from '../features/audit/audit.routes.js';
import reportsRoutes from '../features/reports/reports.routes.js';
import notificationRoutes from '../features/notifications/notification.routes.js';
import dashboardRoutes from '../features/dashboard/dashboard.routes.js';

const router = Router();

// Mount all feature routes under their respective sub-paths
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/organization', organizationRoutes);
router.use('/assets', assetRoutes);
router.use('/allocations', allocationRoutes);
router.use('/bookings', bookingRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/audits', auditRoutes);
router.use('/reports', reportsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
