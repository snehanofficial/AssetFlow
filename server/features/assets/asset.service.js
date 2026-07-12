import prisma from '../../database/client.js';
import { assertValidTransition } from './asset.lifecycle.js';

/**
 * Asset Service
 *
 * Core business logic for asset management.
 * REQ-AST-01, REQ-AST-02, REQ-AST-03, REQ-AST-04
 */

/**
 * Generates a unique asset tag in the format AF-XXXX.
 * Uses count-based sequential numbering padded to at least 4 digits.
 * Retries with a random suffix if a collision occurs.
 *
 * @returns {Promise<string>} The unique asset tag.
 */
async function generateAssetTag() {
  const count = await prisma.asset.count();
  const base = count + 1;
  const padded = String(base).padStart(4, '0');
  const tag = `AF-${padded}`;

  // Check for collision (e.g., if records were deleted and count regressed)
  const existing = await prisma.asset.findUnique({ where: { assetTag: tag } });
  if (!existing) return tag;

  // Fallback: random 6-digit suffix
  const random = Math.floor(100000 + Math.random() * 900000);
  return `AF-${random}`;
}

/**
 * Validates that all required custom fields from the category schema
 * are present and match their declared type.
 *
 * @param {Array} schema - Category customFieldsSchema array.
 * @param {Object} values - Submitted customFields object.
 * @throws {Error} 400 if required fields are missing or mistyped.
 */
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

/**
 * Creates a new asset record.
 *
 * @param {Object} data - Validated asset creation payload.
 * @param {string|null} photoUrl - Uploaded photo URL (if any).
 * @returns {Promise<Asset>}
 */
export async function createAsset(data, photoUrl = null) {
  // 1. Verify category exists
  const category = await prisma.assetCategory.findUnique({
    where: { id: data.categoryId, deletedAt: null },
  });
  if (!category) {
    const error = new Error('The selected category does not exist.');
    error.status = 400;
    error.code = 'CATEGORY_NOT_FOUND';
    throw error;
  }

  // 2. Validate custom fields against category schema
  const schema = Array.isArray(category.customFieldsSchema) ? category.customFieldsSchema : [];
  validateCustomFields(schema, data.customFields);

  // 3. Check serial number uniqueness
  const duplicateSerial = await prisma.asset.findUnique({
    where: { serialNumber: data.serialNumber },
  });
  if (duplicateSerial) {
    const error = new Error(
      `Serial number '${data.serialNumber}' is already registered to another asset.`
    );
    error.status = 400;
    error.code = 'DUPLICATE_SERIAL_NUMBER';
    throw error;
  }

  // 4. Generate asset tag
  const assetTag = await generateAssetTag();

  // 5. Persist the asset
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

/**
 * Lists assets with pagination, search, and filtering.
 * DEPT_HEAD role is restricted to assets allocated within their department.
 *
 * @param {Object} query - Validated query parameters.
 * @param {Object} requestingUser - JWT payload { id, role, departmentId }.
 * @returns {Promise<{ records: Asset[], total: number, page: number, limit: number }>}
 */
export async function listAssets(query, requestingUser) {
  const { page, limit, search, categoryId, status, departmentId, location } = query;
  const skip = (page - 1) * limit;

  const where = { deletedAt: null };

  // Keyword search: tag, serial number, name, location
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

  // DEPT_HEAD: restrict to assets currently allocated to their department members
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
    // Admin/Asset Manager filtering by department
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

/**
 * Returns full asset detail with all historical events for timeline.
 * REQ-AST-04: Chronological history feed.
 *
 * @param {string} assetId
 * @returns {Promise<Asset & { timeline: Array }>}
 */
export async function getAssetById(assetId) {
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

  // Build chronological timeline
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
        description: `Maintenance resolved`,
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

  // Sort timeline by date descending
  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { ...asset, timeline };
}

/**
 * Updates asset status, enforcing lifecycle transition rules.
 * REQ-AST-03: Lifecycle state enforcement.
 *
 * @param {string} assetId
 * @param {string} newStatus
 * @param {Object} requestingUser
 * @returns {Promise<Asset>}
 */
export async function updateAssetStatus(assetId, newStatus, requestingUser) {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null },
  });

  if (!asset) {
    const error = new Error('Asset not found.');
    error.status = 404;
    error.code = 'ASSET_NOT_FOUND';
    throw error;
  }

  // Enforce lifecycle transition
  assertValidTransition(asset.status, newStatus);

  const updated = await prisma.asset.update({
    where: { id: assetId },
    data: { status: newStatus },
  });

  return updated;
}

export default { createAsset, listAssets, getAssetById, updateAssetStatus };
