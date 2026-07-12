import prisma from '../../database/client.js';

/**
 * Publishes a new notification record in the database.
 *
 * @param {Object} params
 * @param {string} params.employeeId
 * @param {string} params.type - NotificationType enum
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.linkUrl]
 * @returns {Promise<Object>} The created notification.
 */
export async function publishNotification({ employeeId, type, title, message, linkUrl }) {
  return await prisma.notification.create({
    data: {
      employeeId,
      type,
      title,
      message,
      linkUrl,
      status: 'UNREAD',
    },
  });
}

/**
 * Retrieves notifications for the active user session.
 * Capped at 50 records sorted by creation date.
 *
 * @param {Object} user
 * @returns {Promise<Object>} Notifications list and unread count.
 */
export async function listNotifications(user) {
  const notifications = await prisma.notification.findMany({
    where: { employeeId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      employeeId: user.id,
      status: 'UNREAD',
    },
  });

  return {
    notifications,
    unreadCount,
  };
}

/**
 * Marks a specific notification as READ.
 * Verify that the target notification belongs to the active user.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {Object} params.user
 * @returns {Promise<Object>} The updated notification.
 */
export async function markNotificationAsRead({ id, user }) {
  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    const error = new Error('Notification not found.');
    error.code = 'NOTIFICATION_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  if (notification.employeeId !== user.id) {
    const error = new Error('You are not authorized to update this notification.');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  return await prisma.notification.update({
    where: { id },
    data: { status: 'READ' },
  });
}

/**
 * Marks all active unread notifications of the user as READ.
 *
 * @param {Object} user
 * @returns {Promise<Object>} Count of updated records.
 */
export async function markAllAsRead(user) {
  return await prisma.notification.updateMany({
    where: {
      employeeId: user.id,
      status: 'UNREAD',
    },
    data: { status: 'READ' },
  });
}
