import prisma from '../../database/client.js';
import { assertValidTransition } from './asset.lifecycle.js';

/**
 * Asset Service
 *
 * Core business logic for asset management.
 * REQ-AST-01, REQ-AST-02, REQ-AST-03, REQ-AST-04
 */

async function generateAssetTag() {
  const count = await prisma.asset.count();
  const base = count + 1;
  const padded = String(base).padStart(4, '0');
  const tag = `AF-${padded}`;

  const existing = await prisma.asset.findUnique({ where: { assetTag: tag } });
  if (!existing) return tag;

  const random = Math.floor(100000 + Math.random() * 900000);
  return `AF-${random}`;
}

function validateCustomFields(schema, values) {
  const errors = [];

  for (const field of schema) {
    const value = values?.[field.name];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`Custom field '${field.name}' is required.`);
      continue;
    }

    if (value !== undefined && value !== null && value !== '') {
      if (field.type === 'number' && typeof value !== 'number' && isNaN(Number(value))) {
        errors.push(`Custom field '${field.name}' must be a number.`);
      }
      if (
        field.type === 'boolean' &&
        typeof value !== 'boolean' &&
        value !== 'true' &&
        value !== 'false'
      ) {
        errors.push(`Custom field '${field.name}' must be a boolean.`);
      }
    }
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(' | '));
    error.status = 400;
    error.code = 'CUSTOM_FIELD_VALIDATION_ERROR';
    error.details = errors;
    throw error;
  }
}

async function getCategoryOrThrow(categoryId) {
  const category = await prisma.assetCategory.findFirst({
    where: { id: categoryId, deletedAt: null },
  });

  if (!category) {
    const error = new Error('The selected category does not exist.');
    error.status = 400;
    error.code = 'CATEGORY_NOT_FOUND';
    throw error;
  }

  return category;
}

async function assertUniqueSerialNumber(serialNumber, assetIdToIgnore = null) {
  const duplicateSerial = await prisma.asset.findFirst({
    where: {
      serialNumber,
      id: assetIdToIgnore ? { not: assetIdToIgnore } : undefined,
    },
  });

  if (duplicateSerial) {
    const error = new Error(
      `Serial number '${serialNumber}' is already registered to another asset.`
    );
    error.status = 400;
    error.code = 'DUPLICATE_SERIAL_NUMBER';
    throw error;
  }
}

async function assertAssetNotLockedInAudit(assetId) {
  const activeAuditItem = await prisma.auditItem.findFirst({
    where: {
      assetId,
      auditCycle: {
        status: 'IN_PROGRESS',
      },
    },
    select: { id: true },
  });

  if (activeAuditItem) {
    const error = new Error(
      'This asset cannot be modified because it is currently undergoing an active audit.'
    );
    error.status = 400;
    error.code = 'ASSET_LOCKED_IN_AUDIT';
    throw error;
  }
}

async function getAssetOrThrow(assetId) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
  });

  if (!asset) {
    const error = new Error('Asset not found.');
    error.status = 404;
    error.code = 'ASSET_NOT_FOUND';
    throw error;
  }

  return asset;
}

async function enrichAssetWithCategory(assetId) {
  return prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, customFieldsSchema: true } },
    },
  });
}

export async function createAsset(data, photoUrl = null) {
  const category = await getCategoryOrThrow(data.categoryId);
  const schema = Array.isArray(category.customFieldsSchema) ? category.customFieldsSchema : [];

  validateCustomFields(schema, data.customFields);
  await assertUniqueSerialNumber(data.serialNumber);

  const assetTag = await generateAssetTag();

  const asset = await prisma.asset.create({
    data: {
      assetTag,
      name: data.name,
      serialNumber: data.serialNumber,
      categoryId: data.categoryId,
      status: 'AVAILABLE',
      condition: data.condition,
      acquisitionDate: new Date(data.acquisitionDate),
      acquisitionCost: data.acquisitionCost ?? null,
      location: data.location,
      isBookable: data.isBookable ?? false,
      photoUrl: photoUrl ?? null,
      customFields: data.customFields ?? {},
    },
    include: {
      category: { select: { id: true, name: true, customFieldsSchema: true } },
    },
  });

  return asset;
}

export async function listAssets(query, requestingUser) {
  const { page, limit, search, categoryId, status, departmentId, location } = query;
  const skip = (page - 1) * limit;

  const where = { deletedAt: null };

  if (search) {
    where.OR = [
      { assetTag: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (location && !search) where.location = { contains: location, mode: 'insensitive' };

  if (requestingUser.role === 'DEPT_HEAD') {
    const deptId = departmentId || requestingUser.departmentId;
    if (deptId) {
      where.allocations = {
        some: {
          status: 'ACTIVE',
          employee: { departmentId: deptId },
        },
      };
    }
  } else if (departmentId) {
    where.allocations = {
      some: {
        status: 'ACTIVE',
        employee: { departmentId },
      },
    };
  }

  const [records, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        allocations: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            employee: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    prisma.asset.count({ where }),
  ]);

  return { records, total, page, limit };
}

export async function getAssetById(assetId, requestingUser) {
  if (requestingUser && requestingUser.role === 'DEPT_HEAD') {
    const activeAllocCount = await prisma.assetAllocation.count({
      where: {
        assetId,
        status: 'ACTIVE',
        employee: { departmentId: requestingUser.departmentId },
      },
    });
    if (activeAllocCount === 0) {
      const error = new Error(
        'Access denied: You can only view assets allocated within your department.'
      );
      error.status = 403;
      error.code = 'FORBIDDEN_DEPARTMENT';
      throw error;
    }
  }

  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, customFieldsSchema: true } },
      allocations: {
        orderBy: { allocatedAt: 'desc' },
        include: {
          employee: { select: { id: true, name: true, email: true } },
        },
      },
      maintenance: {
        orderBy: { createdAt: 'desc' },
        include: {
          requestedBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      },
      transferRequests: {
        orderBy: { createdAt: 'desc' },
        include: {
          requestedBy: { select: { id: true, name: true } },
          targetEmployee: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!asset) {
    const error = new Error('Asset not found.');
    error.status = 404;
    error.code = 'ASSET_NOT_FOUND';
    throw error;
  }

  const isLockedInAudit = !!(await prisma.auditItem.findFirst({
    where: {
      assetId,
      auditCycle: {
        status: 'IN_PROGRESS',
      },
    },
    select: { id: true },
  }));

  const timeline = [];

  for (const alloc of asset.allocations) {
    timeline.push({
      type: 'ALLOCATION',
      date: alloc.allocatedAt,
      description: `Allocated to ${alloc.employee.name}`,
      meta: {
        employeeId: alloc.employee.id,
        employeeName: alloc.employee.name,
        status: alloc.status,
      },
    });
    if (alloc.returnedAt) {
      timeline.push({
        type: 'RETURN',
        date: alloc.returnedAt,
        description: `Returned by ${alloc.employee.name}`,
        meta: {
          employeeId: alloc.employee.id,
          employeeName: alloc.employee.name,
          returnCondition: alloc.returnCondition,
          returnNotes: alloc.returnNotes,
        },
      });
    }
  }

  for (const mx of asset.maintenance) {
    timeline.push({
      type: 'MAINTENANCE',
      date: mx.createdAt,
      description: `Maintenance request: ${mx.description.substring(0, 80)}`,
      meta: { status: mx.status, priority: mx.priority, requestedBy: mx.requestedBy?.name },
    });
    if (mx.completedAt) {
      timeline.push({
        type: 'MAINTENANCE_RESOLVED',
        date: mx.completedAt,
        description: 'Maintenance resolved',
        meta: { resolutionNotes: mx.resolutionNotes },
      });
    }
  }

  for (const tx of asset.transferRequests) {
    timeline.push({
      type: 'TRANSFER',
      date: tx.createdAt,
      description: `Transfer requested: ${tx.requestedBy.name} → ${tx.targetEmployee.name}`,
      meta: {
        status: tx.status,
        reason: tx.reason,
        requestedBy: tx.requestedBy.name,
        targetEmployee: tx.targetEmployee.name,
      },
    });
  }

  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { ...asset, isLockedInAudit, timeline };
}

export async function updateAsset(assetId, data, photoUrl) {
  const existingAsset = await getAssetOrThrow(assetId);
  await assertAssetNotLockedInAudit(assetId);

  const category = await getCategoryOrThrow(data.categoryId);
  const schema = Array.isArray(category.customFieldsSchema) ? category.customFieldsSchema : [];

  validateCustomFields(schema, data.customFields);
  await assertUniqueSerialNumber(data.serialNumber, assetId);

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      name: data.name,
      serialNumber: data.serialNumber,
      categoryId: data.categoryId,
      condition: data.condition,
      acquisitionDate: new Date(data.acquisitionDate),
      acquisitionCost: data.acquisitionCost ?? null,
      location: data.location,
      isBookable: data.isBookable ?? false,
      customFields: data.customFields ?? {},
      photoUrl: photoUrl ?? existingAsset.photoUrl,
    },
  });

  const asset = await enrichAssetWithCategory(assetId);
  return { before: existingAsset, asset };
}

export async function deleteAsset(assetId) {
  const existingAsset = await getAssetOrThrow(assetId);
  await assertAssetNotLockedInAudit(assetId);

  const [activeAllocationCount, activeBookingCount, activeMaintenanceCount, pendingTransferCount] =
    await Promise.all([
      prisma.assetAllocation.count({
        where: { assetId, status: 'ACTIVE' },
      }),
      prisma.booking.count({
        where: { assetId, status: { in: ['UPCOMING', 'ONGOING'] } },
      }),
      prisma.maintenanceRequest.count({
        where: { assetId, status: { in: ['PENDING', 'APPROVED', 'IN_PROGRESS'] } },
      }),
      prisma.transferRequest.count({
        where: { assetId, status: 'PENDING' },
      }),
    ]);

  if (activeAllocationCount > 0) {
    const error = new Error(
      'This asset cannot be deleted while it has an active allocation. Return or transfer it first.'
    );
    error.status = 400;
    error.code = 'ASSET_HAS_ACTIVE_ALLOCATIONS';
    throw error;
  }

  if (activeBookingCount > 0) {
    const error = new Error(
      'This asset cannot be deleted while it has upcoming or ongoing bookings.'
    );
    error.status = 400;
    error.code = 'ASSET_HAS_ACTIVE_BOOKINGS';
    throw error;
  }

  if (activeMaintenanceCount > 0) {
    const error = new Error(
      'This asset cannot be deleted while it has active maintenance requests.'
    );
    error.status = 400;
    error.code = 'ASSET_HAS_ACTIVE_MAINTENANCE';
    throw error;
  }

  if (pendingTransferCount > 0) {
    const error = new Error('This asset cannot be deleted while a transfer request is pending.');
    error.status = 400;
    error.code = 'ASSET_HAS_PENDING_TRANSFERS';
    throw error;
  }

  const asset = await prisma.asset.update({
    where: { id: assetId },
    data: { deletedAt: new Date() },
  });

  return { before: existingAsset, asset };
}

export async function updateAssetStatus(assetId, newStatus, _requestingUser) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
  });

  if (!asset) {
    const error = new Error('Asset not found.');
    error.status = 404;
    error.code = 'ASSET_NOT_FOUND';
    throw error;
  }

  assertValidTransition(asset.status, newStatus);

  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: { status: newStatus },
  });

  return updated;
}

export default {
  createAsset,
  listAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  updateAssetStatus,
};
