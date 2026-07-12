import prisma from '../../database/client.js';
import { assertValidTransition } from '../assets/asset.lifecycle.js';

/**
 * Allocation Service
 *
 * Business logic for allocating assets to employees and processing returns.
 * REQ-ALC-01, REQ-ALC-03
 */

/**
 * Allocates an available asset to an active employee.
 * Runs in a database transaction for atomicity.
 *
 * @param {Object} data - Validated payload: { assetId, employeeId, expectedReturnAt? }
 * @param {Object} requestingUser - JWT payload with { id, role, departmentId }
 * @returns {Promise<AssetAllocation>}
 */
export async function allocateAsset(data, requestingUser) {
  const { assetId, employeeId, expectedReturnAt } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Verify asset exists and is available
    const asset = await tx.asset.findFirst({
      where: { id: assetId, deletedAt: null },
      include: {
        allocations: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            employee: { select: { id: true, name: true } },
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

    // Double-allocation prevention (REQ-ALC-01)
    if (asset.allocations.length > 0) {
      const holder = asset.allocations[0].employee;
      const error = new Error(
        `Asset is currently allocated to ${holder.name}. Use the Transfer Request workflow to reassign.`
      );
      error.status = 409;
      error.code = 'ASSET_ALREADY_ALLOCATED';
      error.currentHolder = holder;
      throw error;
    }

    if (asset.status !== 'AVAILABLE') {
      const error = new Error(
        `Asset cannot be allocated because its current status is '${asset.status}'.`
      );
      error.status = 400;
      error.code = 'ASSET_NOT_AVAILABLE';
      throw error;
    }

    // 2. Verify target employee exists and is active
    const employee = await tx.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
    });

    if (!employee) {
      const error = new Error('Employee not found.');
      error.status = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    if (employee.status !== 'ACTIVE') {
      const error = new Error('Cannot allocate asset to an inactive employee.');
      error.status = 400;
      error.code = 'EMPLOYEE_INACTIVE';
      throw error;
    }

    // 3. DEPT_HEAD can only allocate within their own department
    if (requestingUser.role === 'DEPT_HEAD') {
      if (employee.departmentId !== requestingUser.departmentId) {
        const error = new Error(
          'Department Head can only allocate assets within their own department.'
        );
        error.status = 403;
        error.code = 'FORBIDDEN_DEPARTMENT';
        throw error;
      }
    }

    // 4. Enforce lifecycle transition: AVAILABLE → ALLOCATED
    assertValidTransition(asset.status, 'ALLOCATED');

    // 5. Create allocation and update asset status atomically
    const [allocation] = await Promise.all([
      tx.assetAllocation.create({
        data: {
          assetId,
          employeeId,
          status: 'ACTIVE',
          expectedReturnAt: expectedReturnAt || null,
        },
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          employee: { select: { id: true, name: true, email: true, departmentId: true } },
        },
      }),
      tx.asset.update({
        where: { id: assetId },
        data: { status: 'ALLOCATED' },
      }),
    ]);

    return allocation;
  });
}

/**
 * Processes an asset return (check-in).
 * Requires return condition and notes.
 * Updates asset back to AVAILABLE (or UNDER_MAINTENANCE if condition is POOR).
 *
 * @param {string} allocationId - ID of the active AssetAllocation record.
 * @param {Object} data - Validated return payload: { returnCondition, returnNotes }
 * @param {Object} requestingUser - JWT payload
 * @returns {Promise<AssetAllocation>}
 */
export async function returnAsset(allocationId, data, requestingUser) {
  const { returnCondition, returnNotes } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Find the active allocation
    const allocation = await tx.assetAllocation.findFirst({
      where: { id: allocationId, status: 'ACTIVE' },
      include: {
        asset: true,
        employee: { select: { id: true, name: true } },
      },
    });

    if (!allocation) {
      const error = new Error(
        'Active allocation not found. The asset may have already been returned.'
      );
      error.status = 404;
      error.code = 'ALLOCATION_NOT_FOUND';
      throw error;
    }

    // 2. DEPT_HEAD can only return assets for their department members
    if (requestingUser.role === 'DEPT_HEAD') {
      const allocEmployee = await tx.employee.findUnique({
        where: { id: allocation.employeeId },
        select: { departmentId: true },
      });
      if (allocEmployee?.departmentId !== requestingUser.departmentId) {
        const error = new Error(
          'You can only process returns for employees within your department.'
        );
        error.status = 403;
        error.code = 'FORBIDDEN_DEPARTMENT';
        throw error;
      }
    }

    // 3. Determine new asset status:
    //    POOR condition → send to UNDER_MAINTENANCE, otherwise → AVAILABLE
    const newAssetStatus = returnCondition === 'POOR' ? 'UNDER_MAINTENANCE' : 'AVAILABLE';

    // 4. Enforce lifecycle transition: ALLOCATED → AVAILABLE / UNDER_MAINTENANCE
    assertValidTransition(allocation.asset.status, newAssetStatus);

    // 5. Update allocation and asset atomically
    const [updatedAllocation] = await Promise.all([
      tx.assetAllocation.update({
        where: { id: allocationId },
        data: {
          status: 'RETURNED',
          returnedAt: new Date(),
          returnCondition,
          returnNotes,
        },
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          employee: { select: { id: true, name: true, email: true } },
        },
      }),
      tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: newAssetStatus, condition: returnCondition },
      }),
    ]);

    return updatedAllocation;
  });
}

/**
 * Lists allocations with optional filters.
 *
 * @param {Object} query - { status?, employeeId?, assetId?, page, limit }
 * @param {Object} requestingUser
 * @returns {Promise<{ records, total, page, limit }>}
 */
export async function listAllocations(query, requestingUser) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) where.status = query.status;
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.assetId) where.assetId = query.assetId;

  // DEPT_HEAD: restrict to their department members
  if (requestingUser.role === 'DEPT_HEAD') {
    where.employee = { departmentId: requestingUser.departmentId };
  }

  const [records, total] = await Promise.all([
    prisma.assetAllocation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { allocatedAt: 'desc' },
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
        employee: { select: { id: true, name: true, email: true, departmentId: true } },
      },
    }),
    prisma.assetAllocation.count({ where }),
  ]);

  // Mark overdue records inline (expectedReturnAt < now and still ACTIVE)
  const now = new Date();
  const enriched = records.map((r) => ({
    ...r,
    isOverdue:
      r.status === 'ACTIVE' && r.expectedReturnAt != null && new Date(r.expectedReturnAt) < now,
  }));

  return { records: enriched, total, page, limit };
}

export default { allocateAsset, returnAsset, listAllocations };
