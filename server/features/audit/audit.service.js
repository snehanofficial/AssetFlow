import prisma from '../../database/client.js';
import { logMutation } from '../../services/audit.service.js';
import { publishNotification } from '../notifications/notification.service.js';

/**
 * Lists all audit cycles.
 * Standard employees can only see cycles they are assigned to.
 * Managers (Admin, Asset Manager) see all cycles.
 *
 * @param {Object} user
 * @returns {Promise<Array>} List of audit cycles.
 */
export async function listAuditCycles(user) {
  const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(user.role);
  const where = {};

  if (!isManager) {
    where.auditors = {
      some: {
        id: user.id,
      },
    };
  }

  return await prisma.auditCycle.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      auditors: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Retrieve details of a specific audit cycle.
 *
 * @param {string} id
 * @returns {Promise<Object|null>} The audit cycle details.
 */
export async function getAuditCycle(id) {
  return await prisma.auditCycle.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      auditors: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetTag: true,
              location: true,
              status: true,
            },
          },
          verifiedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: {
          asset: {
            assetTag: 'asc',
          },
        },
      },
    },
  });
}

/**
 * Creates a new audit cycle, scopes matching assets, and initializes pending items.
 *
 * @param {Object} params
 * @param {string} params.title
 * @param {string} params.scopeType - 'department' or 'location'
 * @param {string} params.scopeValue
 * @param {string} params.endDate
 * @param {Array<string>} params.auditorIds
 * @param {Object} params.user
 * @param {string} [params.ipAddress]
 * @returns {Promise<Object>} The created cycle.
 */
export async function createAuditCycle({
  title,
  scopeType,
  scopeValue,
  endDate,
  auditorIds,
  user,
  ipAddress,
}) {
  const isAdmin = user.role === 'ADMIN';
  if (!isAdmin) {
    const error = new Error('Only administrators can initialize audit cycles.');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  if (!auditorIds || auditorIds.length === 0) {
    const error = new Error('At least one assigned auditor is required.');
    error.code = 'AUDITORS_REQUIRED';
    error.statusCode = 400;
    throw error;
  }

  const cycle = await prisma.$transaction(async (tx) => {
    // 1. Verify auditor IDs are valid active employees
    const activeAuditors = await tx.employee.findMany({
      where: {
        id: { in: auditorIds },
        deletedAt: null,
        status: 'ACTIVE',
      },
    });

    if (activeAuditors.length !== auditorIds.length) {
      const error = new Error('One or more selected auditors are inactive or invalid.');
      error.code = 'INVALID_AUDITORS';
      error.statusCode = 400;
      throw error;
    }

    // 2. Identify scoped assets
    let assets = [];
    if (scopeType === 'location') {
      assets = await tx.asset.findMany({
        where: {
          location: scopeValue,
          deletedAt: null,
        },
      });
    } else if (scopeType === 'department') {
      const allocations = await tx.assetAllocation.findMany({
        where: {
          status: 'ACTIVE',
          employee: {
            departmentId: scopeValue,
          },
          asset: {
            deletedAt: null,
          },
        },
        include: {
          asset: true,
        },
      });
      assets = allocations.map((alloc) => alloc.asset);
    } else {
      const error = new Error('Invalid scope filter type.');
      error.code = 'INVALID_SCOPE_TYPE';
      error.statusCode = 400;
      throw error;
    }

    if (assets.length === 0) {
      const error = new Error('No active assets found matching the selected scope.');
      error.code = 'NO_ASSETS_IN_SCOPE';
      error.statusCode = 400;
      throw error;
    }

    // 3. Create Audit Cycle
    const newCycle = await tx.auditCycle.create({
      data: {
        title,
        status: 'IN_PROGRESS',
        scope: JSON.stringify({ type: scopeType, value: scopeValue }),
        endDate: new Date(endDate),
        createdById: user.id,
        auditors: {
          connect: auditorIds.map((id) => ({ id })),
        },
      },
      include: {
        auditors: true,
      },
    });

    // 4. Create Audit Items
    const itemsData = assets.map((asset) => ({
      auditCycleId: newCycle.id,
      assetId: asset.id,
      status: 'PENDING',
    }));

    await tx.auditItem.createMany({
      data: itemsData,
    });

    return newCycle;
  });

  // 5. Log audit log mutation
  await logMutation({
    actorId: user.id,
    actorEmail: user.email,
    action: 'INSERT',
    tableName: 'AuditCycle',
    recordId: cycle.id,
    newValue: cycle,
    ipAddress,
  });

  // Send notifications to assigned auditors
  for (const auditorId of auditorIds) {
    await publishNotification({
      employeeId: auditorId,
      type: 'AUDIT_ASSIGNED',
      title: 'New Audit Cycle Assigned',
      message: `You have been assigned as auditor for campaign: "${cycle.title}".`,
      linkUrl: '/audits',
    }).catch(() => {});
  }

  return cycle;
}

/**
 * Updates status of an audit item inside a cycle.
 *
 * @param {Object} params
 * @param {string} params.itemId
 * @param {string} params.status - 'VERIFIED', 'MISSING', 'DAMAGED'
 * @param {string} [params.notes]
 * @param {Object} params.user
 * @param {string} [params.ipAddress]
 * @returns {Promise<Object>} The updated item.
 */
export async function updateAuditItem({ itemId, status, notes, user, ipAddress }) {
  const updatedItem = await prisma.$transaction(async (tx) => {
    // 1. Fetch item
    const item = await tx.auditItem.findUnique({
      where: { id: itemId },
      include: {
        auditCycle: {
          include: {
            auditors: true,
          },
        },
      },
    });

    if (!item) {
      const error = new Error('Audit item not found.');
      error.code = 'AUDIT_ITEM_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    // 2. Cycle must be in progress
    if (item.auditCycle.status !== 'IN_PROGRESS') {
      const error = new Error('Cannot update audit items. The cycle is not in progress.');
      error.code = 'INVALID_CYCLE_STATUS';
      error.statusCode = 400;
      throw error;
    }

    // 3. Authorization: Assigned auditor or manager
    const isAuditor = item.auditCycle.auditors.some((a) => a.id === user.id);
    const isManager = ['ADMIN', 'ASSET_MANAGER'].includes(user.role);

    if (!isAuditor && !isManager) {
      const error = new Error('You are not authorized to audit this item.');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }

    // 4. Update item status
    return await tx.auditItem.update({
      where: { id: itemId },
      data: {
        status,
        notes,
        verifiedById: user.id,
        verifiedAt: new Date(),
      },
      include: {
        asset: {
          select: { id: true, name: true, assetTag: true },
        },
      },
    });
  });

  // 5. Log audit log mutation
  await logMutation({
    actorId: user.id,
    actorEmail: user.email,
    action: 'UPDATE',
    tableName: 'AuditItem',
    recordId: updatedItem.id,
    oldValue: { id: updatedItem.id, status: 'PENDING' },
    newValue: { id: updatedItem.id, status, notes },
    ipAddress,
  });

  return updatedItem;
}

/**
 * Closes an audit cycle and cascades statuses on closure.
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {Object} params.user
 * @param {string} [params.ipAddress]
 * @returns {Promise<Object>} The closed cycle.
 */
export async function closeAuditCycle({ id, user, ipAddress }) {
  const isAdmin = user.role === 'ADMIN';
  if (!isAdmin) {
    const error = new Error('Only administrators can close audit cycles.');
    error.code = 'FORBIDDEN';
    error.statusCode = 403;
    throw error;
  }

  const closed = await prisma.$transaction(async (tx) => {
    // 1. Fetch cycle
    const cycle = await tx.auditCycle.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!cycle) {
      const error = new Error('Audit cycle not found.');
      error.code = 'AUDIT_NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    if (cycle.status !== 'IN_PROGRESS') {
      const error = new Error('Only in-progress audit cycles can be closed.');
      error.code = 'INVALID_CYCLE_STATUS';
      error.statusCode = 400;
      throw error;
    }

    // 2. Verify all items are audited (none remain PENDING)
    const pendingCount = await tx.auditItem.count({
      where: {
        auditCycleId: id,
        status: 'PENDING',
      },
    });

    if (pendingCount > 0) {
      const error = new Error('Cannot close audit cycle. There are pending items remaining.');
      error.code = 'PENDING_ITEMS_EXIST';
      error.statusCode = 400;
      throw error;
    }

    // 3. Update cycle status to CLOSED
    const closedCycle = await tx.auditCycle.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    // 4. Cascade Asset status changes
    // MISSING -> Asset status = LOST
    const missingItems = await tx.auditItem.findMany({
      where: { auditCycleId: id, status: 'MISSING' },
    });
    for (const item of missingItems) {
      await tx.asset.update({
        where: { id: item.assetId },
        data: { status: 'LOST' },
      });
    }

    // DAMAGED -> Asset status = UNDER_MAINTENANCE and generate repair tickets
    const damagedItems = await tx.auditItem.findMany({
      where: { auditCycleId: id, status: 'DAMAGED' },
    });
    for (const item of damagedItems) {
      await tx.asset.update({
        where: { id: item.assetId },
        data: { status: 'UNDER_MAINTENANCE' },
      });

      await tx.maintenanceRequest.create({
        data: {
          assetId: item.assetId,
          requestedById: user.id,
          status: 'PENDING',
          priority: 'HIGH',
          description: `Auto-reported defect from Audit Cycle: "${cycle.title}". Notes: ${item.notes || 'None'}`,
        },
      });
    }

    return closedCycle;
  });

  // 5. Log audit log mutation
  await logMutation({
    actorId: user.id,
    actorEmail: user.email,
    action: 'UPDATE',
    tableName: 'AuditCycle',
    recordId: closed.id,
    oldValue: { id: closed.id, status: 'IN_PROGRESS' },
    newValue: { id: closed.id, status: 'CLOSED' },
    ipAddress,
  });

  return closed;
}
