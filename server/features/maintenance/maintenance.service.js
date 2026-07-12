import prisma from '../../database/client.js';
import { logMutation } from '../../services/audit.service.js';
import { publishNotification } from '../notifications/notification.service.js';

/**
 * Fetch list of maintenance requests.
 * Supports filtering by status, priority, and assetId.
 *
 * @param {Object} filters
 * @returns {Promise<Array>} List of maintenance requests.
 */
export async function listMaintenanceRequests(filters = {}) {
  const { status, priority, assetId } = filters;
  const where = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assetId) where.assetId = assetId;

  return await prisma.maintenanceRequest.findMany({
    where,
    include: {
      asset: {
        select: {
          id: true,
          name: true,
          assetTag: true,
          status: true,
        },
      },
      requestedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Raises a new maintenance/repair request for an asset.
 *
 * @param {Object} params
 * @param {string} params.assetId
 * @param {string} params.description
 * @param {string} params.priority
 * @param {Object} params.user
 * @param {string} [params.ipAddress]
 * @returns {Promise<Object>} The created request.
 */
export async function raiseMaintenanceRequest({ assetId, description, priority, user, ipAddress }) {
  const request = await prisma.$transaction(async (tx) => {
    // 1. Verify asset exists
    const asset = await tx.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset || asset.deletedAt !== null) {
      const error = new Error('Asset not found.');
      error.code = 'ASSET_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // 2. Block if lost, retired, or disposed
    const blockedStatuses = ['LOST', 'RETIRED', 'DISPOSED'];
    if (blockedStatuses.includes(asset.status)) {
      const error = new Error(
        `Cannot raise repair for asset. Current status is ${asset.status}.`
      );
      error.code = 'INVALID_ASSET_STATUS';
      error.statusCode = 400;
      throw error;
    }

    // 3. Create request
    return await tx.maintenanceRequest.create({
      data: {
        assetId,
        requestedById: user.id,
        status: 'PENDING',
        priority,
        description,
      },
      include: {
        asset: true,
        requestedBy: true,
      },
    });
  });

  // 4. Log audit log mutation
  await logMutation({
    actorId: user.id,
    actorEmail: user.email,
    action: 'INSERT',
    tableName: 'MaintenanceRequest',
    recordId: request.id,
    newValue: request,
    ipAddress,
  });

  return request;
}

/**
 * Approves a maintenance request and assigns it to a technician.
 * Asset transitions to UNDER_MAINTENANCE and request transitions to IN_PROGRESS.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.assignedToId
 * @param {Object} params.user
 * @param {string} [params.ipAddress]
 * @returns {Promise<Object>} The updated request.
 */
export async function approveMaintenanceRequest({ id, assignedToId, user, ipAddress }) {
  const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(user.role);
  if (!isManager) {
    const error = new Error('Only Asset Managers or Admins can approve and assign repairs.');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Verify request is PENDING
    const request = await tx.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!request) {
      const error = new Error('Maintenance request not found.');
      error.code = 'MAINTENANCE_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (request.status !== 'PENDING') {
      const error = new Error('Only pending maintenance requests can be approved.');
      error.code = 'INVALID_REQUEST_STATUS';
      error.statusCode = 400;
      throw error;
    }

    // 2. Verify technician (assignedToId) exists and is active
    const technician = await tx.employee.findUnique({
      where: { id: assignedToId },
    });

    if (!technician || technician.deletedAt !== null || technician.status === 'INACTIVE') {
      const error = new Error('Technician employee account is inactive or not found.');
      error.code = 'TECHNICIAN_NOT_FOUND';
      error.statusCode = 400;
      throw error;
    }

    // 3. Update request status to IN_PROGRESS, assign, approve
    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        assignedToId,
        approvedById: user.id,
        approvedAt: new Date(),
      },
      include: {
        asset: true,
        assignedTo: true,
        approvedBy: true,
      },
    });

    // 4. Update asset status to UNDER_MAINTENANCE
    await tx.asset.update({
      where: { id: request.assetId },
      data: { status: 'UNDER_MAINTENANCE' },
    });

    return updatedRequest;
  });

  // 5. Log audit log mutation
  await logMutation({
    actorId: user.id,
    actorEmail: user.email,
    action: 'UPDATE',
    tableName: 'MaintenanceRequest',
    recordId: updated.id,
    oldValue: { id: updated.id, status: 'PENDING' },
    newValue: { id: updated.id, status: 'IN_PROGRESS', assignedToId },
    ipAddress,
  });

  // Notify requester
  await publishNotification({
    employeeId: updated.requestedById,
    type: 'MAINTENANCE_APPROVED',
    title: 'Repair Ticket Approved',
    message: `Your repair request for ${updated.asset.name} (${updated.asset.assetTag}) is approved and assigned to a technician.`,
    linkUrl: '/maintenance',
  }).catch(() => {});

  // Notify assigned technician (if different)
  if (updated.assignedToId && updated.assignedToId !== updated.requestedById) {
    await publishNotification({
      employeeId: updated.assignedToId,
      type: 'MAINTENANCE_APPROVED',
      title: 'New Maintenance Assignment',
      message: `You have been assigned to repair ${updated.asset.name} (${updated.asset.assetTag}).`,
      linkUrl: '/maintenance',
    }).catch(() => {});
  }

  return updated;
}

/**
 * Rejects a maintenance request (requires reason).
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.reason
 * @param {Object} params.user
 * @param {string} [params.ipAddress]
 * @returns {Promise<Object>} The updated request.
 */
export async function rejectMaintenanceRequest({ id, reason, user, ipAddress }) {
  const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(user.role);
  if (!isManager) {
    const error = new Error('Only Asset Managers or Admins can reject repairs.');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  if (!reason || reason.trim() === '') {
    const error = new Error('Rejection reason is required.');
    error.code = 'REJECTION_REASON_REQUIRED';
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Verify request is PENDING
    const request = await tx.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      const error = new Error('Maintenance request not found.');
      error.code = 'MAINTENANCE_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (request.status !== 'PENDING') {
      const error = new Error('Only pending maintenance requests can be rejected.');
      error.code = 'INVALID_REQUEST_STATUS';
      error.statusCode = 400;
      throw error;
    }

    // 2. Reject request
    return await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        resolutionNotes: reason,
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });
  });

  // 3. Log audit log mutation
  await logMutation({
    actorId: user.id,
    actorEmail: user.email,
    action: 'UPDATE',
    tableName: 'MaintenanceRequest',
    recordId: updated.id,
    oldValue: { id: updated.id, status: 'PENDING' },
    newValue: { id: updated.id, status: 'REJECTED', resolutionNotes: reason },
    ipAddress,
  });

  // Notify requester of rejection
  await publishNotification({
    employeeId: updated.requestedById,
    type: 'MAINTENANCE_REJECTED',
    title: 'Repair Ticket Rejected',
    message: `Your repair request for asset ID ${updated.assetId} has been rejected. Reason: ${reason}`,
    linkUrl: '/maintenance',
  }).catch(() => {});

  return updated;
}

/**
 * Resolves a maintenance request.
 * Request transitions to RESOLVED and asset transitions back to AVAILABLE.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.resolutionNotes
 * @param {Object} params.user
 * @param {string} [params.ipAddress]
 * @returns {Promise<Object>} The updated request.
 */
export async function resolveMaintenanceRequest({ id, resolutionNotes, user, ipAddress }) {
  if (!resolutionNotes || resolutionNotes.trim() === '') {
    const error = new Error('Resolution notes are required to resolve a repair.');
    error.code = 'RESOLUTION_NOTES_REQUIRED';
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Verify request exists and is IN_PROGRESS
    const request = await tx.maintenanceRequest.findUnique({
      where: { id },
      include: { asset: true },
    });

    if (!request) {
      const error = new Error('Maintenance request not found.');
      error.code = 'MAINTENANCE_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (request.status !== 'IN_PROGRESS') {
      const error = new Error('Only in-progress maintenance requests can be resolved.');
      error.code = 'INVALID_REQUEST_STATUS';
      error.statusCode = 400;
      throw error;
    }

    // 2. Authorization: assigned technician or managers (Admin/Asset Manager)
    const isAssignee = request.assignedToId === user.id;
    const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(user.role);

    if (!isAssignee && !isManager) {
      const error = new Error('You are not authorized to resolve this maintenance task.');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }

    // 3. Resolve request
    const updatedRequest = await tx.maintenanceRequest.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolutionNotes,
        completedAt: new Date(),
      },
      include: {
        asset: true,
        assignedTo: true,
      },
    });

    // 4. Update asset status back to AVAILABLE
    await tx.asset.update({
      where: { id: request.assetId },
      data: { status: 'AVAILABLE' },
    });

    return updatedRequest;
  });

  // 5. Log audit log mutation
  await logMutation({
    actorId: user.id,
    actorEmail: user.email,
    action: 'UPDATE',
    tableName: 'MaintenanceRequest',
    recordId: updated.id,
    oldValue: { id: updated.id, status: 'IN_PROGRESS' },
    newValue: { id: updated.id, status: 'RESOLVED', resolutionNotes },
    ipAddress,
  });

  // Notify requester of resolution
  await publishNotification({
    employeeId: updated.requestedById,
    type: 'MAINTENANCE_RESOLVED',
    title: 'Repair Ticket Resolved',
    message: `The repair request for ${updated.asset.name} (${updated.asset.assetTag}) has been resolved. Notes: ${resolutionNotes}`,
    linkUrl: '/maintenance',
  }).catch(() => {});

  return updated;
}
