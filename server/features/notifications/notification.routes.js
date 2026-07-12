import { Router } from 'express';
import authenticateSession from '../../middlewares/auth.middleware.js';
import {
  listNotifications,
  markNotificationAsRead,
  markAllAsRead,
} from './notification.service.js';

const router = Router();

/**
 * GET /api/v1/notifications
 * Lists personal notifications inbox and retrieves unread counts.
 */
router.get('/', authenticateSession, async (req, res, next) => {
  try {
    const data = await listNotifications(req.user);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/notifications/read-all
 * Marks all unread items for active session employee as READ.
 */
router.patch('/read-all', authenticateSession, async (req, res, next) => {
  try {
    const result = await markAllAsRead(req.user);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a specific unread notification as READ.
 */
router.patch('/:id/read', authenticateSession, async (req, res, next) => {
  try {
    const notification = await markNotificationAsRead({
      id: req.params.id,
      user: req.user,
    });

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
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
