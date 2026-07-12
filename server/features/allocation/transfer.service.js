import prisma from '../../database/client.js';

/**
 * Transfer Service
 *
 * Business logic for asset transfer request workflows.
 * REQ-ALC-02: Create, approve, and reject transfer requests.
 */

/**
 * Creates a new transfer request for an allocated asset.
 * Asset must currently be ALLOCATED.
 *
 * @param {Object} data - { assetId, targetEmployeeId, reason? }
 * @param {Object} requestingUser - JWT payload
 * @returns {Promise<TransferRequest>}
 */
export async function createTransferRequest(data, requestingUser) {
  const { assetId, targetEmployeeId, reason } = data;

  return await prisma.$transaction(async (tx) => {
    // 1. Verify the asset exists and is currently ALLOCATED
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

    if (asset.status !== 'ALLOCATED' || asset.allocations.length === 0) {
      const error = new Error('Asset must be currently allocated to initiate a transfer request.');
      error.status = 400;
      error.code = 'ASSET_NOT_ALLOCATED';
      throw error;
    }

    // 2. Verify target employee exists and is active
    const targetEmployee = await tx.employee.findFirst({
      where: { id: targetEmployeeId, deletedAt: null },
    });

    if (!targetEmployee) {
      const error = new Error('Target employee not found.');
      error.status = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    if (targetEmployee.status !== 'ACTIVE') {
      const error = new Error('Cannot transfer asset to an inactive employee.');
      error.status = 400;
      error.code = 'EMPLOYEE_INACTIVE';
      throw error;
    }

    // DEPT_HEAD: restrict transfers to target employees in their own department
    if (requestingUser.role === 'DEPT_HEAD') {
      if (targetEmployee.departmentId !== requestingUser.departmentId) {
        const error = new Error(
          'Department Head can only request transfers to employees within their own department.'
        );
        error.status = 403;
        error.code = 'FORBIDDEN_DEPARTMENT';
        throw error;
      }
    }

    // 3. Prevent transferring to the same current holder
    const currentHolder = asset.allocations[0];
    if (currentHolder.employee.id === targetEmployeeId) {
      const error = new Error('Target employee is already the current holder of this asset.');
      error.status = 400;
      error.code = 'SAME_EMPLOYEE_TRANSFER';
      throw error;
    }

    // 4. Check if there is already a pending transfer for this asset
    const existingPending = await tx.transferRequest.findFirst({
      where: { assetId, status: 'PENDING' },
    });

    if (existingPending) {
      const error = new Error(
        'A transfer request is already pending for this asset. Cancel or resolve it first.'
      );
      error.status = 409;
      error.code = 'TRANSFER_ALREADY_PENDING';
      throw error;
    }

    // 5. Create the transfer request
    const transferRequest = await tx.transferRequest.create({
      data: {
        assetId,
        requestedById: requestingUser.id,
        targetEmployeeId,
        status: 'PENDING',
        reason: reason || null,
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        targetEmployee: { select: { id: true, name: true, email: true } },
      },
    });

    return transferRequest;
  });
}

/**
 * Approves a pending transfer request.
 * Wraps the entire operation in a transaction:
 * - Closes the current allocation (RETURNED)
 * - Opens a new allocation for the target employee
 * - Updates the asset holder record
 * - Marks transfer as APPROVED
 *
 * @param {string} transferId
 * @param {Object} requestingUser - Must be ADMIN, ASSET_MANAGER, or DEPT_HEAD
 * @returns {Promise<TransferRequest>}
 */
export async function approveTransferRequest(transferId, requestingUser) {
  return await prisma.$transaction(async (tx) => {
    // 1. Load the transfer request
    const transfer = await tx.transferRequest.findFirst({
      where: { id: transferId, status: 'PENDING' },
      include: {
        asset: true,
        targetEmployee: { select: { id: true, name: true, departmentId: true } },
      },
    });

    if (!transfer) {
      const error = new Error('Pending transfer request not found.');
      error.status = 404;
      error.code = 'TRANSFER_NOT_FOUND';
      throw error;
    }

    // 2. DEPT_HEAD: can only approve if target employee is in their department
    if (requestingUser.role === 'DEPT_HEAD') {
      if (transfer.targetEmployee.departmentId !== requestingUser.departmentId) {
        const error = new Error(
          'Department Head can only approve transfers for employees within their own department.'
        );
        error.status = 403;
        error.code = 'FORBIDDEN_DEPARTMENT';
        throw error;
      }
    }

    // 3. Find the active allocation
    const activeAllocation = await tx.assetAllocation.findFirst({
      where: { assetId: transfer.assetId, status: 'ACTIVE' },
    });

    if (!activeAllocation) {
      const error = new Error(
        'No active allocation found for this asset. Cannot approve transfer.'
      );
      error.status = 400;
      error.code = 'NO_ACTIVE_ALLOCATION';
      throw error;
    }

    const now = new Date();

    // 4. Close current allocation + open new allocation + update transfer atomically
    const [, newAllocation, updatedTransfer] = await Promise.all([
      // Close current allocation
      tx.assetAllocation.update({
        where: { id: activeAllocation.id },
        data: {
          status: 'RETURNED',
          returnedAt: now,
          returnNotes: `Asset transferred to ${transfer.targetEmployee.name} via transfer request.`,
        },
      }),
      // Create new allocation for target employee
      tx.assetAllocation.create({
        data: {
          assetId: transfer.assetId,
          employeeId: transfer.targetEmployeeId,
          status: 'ACTIVE',
          allocatedAt: now,
        },
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          employee: { select: { id: true, name: true, email: true } },
        },
      }),
      // Mark transfer as approved
      tx.transferRequest.update({
        where: { id: transferId },
        data: {
          status: 'APPROVED',
          approvedById: requestingUser.id,
          approvedAt: now,
        },
        include: {
          asset: { select: { id: true, assetTag: true, name: true } },
          requestedBy: { select: { id: true, name: true } },
          targetEmployee: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      }),
    ]);

    // The asset status remains ALLOCATED (just changes holder)
    return { transfer: updatedTransfer, newAllocation };
  });
}

/**
 * Rejects a pending transfer request.
 * Asset remains with the current holder.
 *
 * @param {string} transferId
 * @param {Object} data - { rejectReason? }
 * @param {Object} requestingUser
 * @returns {Promise<TransferRequest>}
 */
export async function rejectTransferRequest(transferId, data, requestingUser) {
  return await prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.findFirst({
      where: { id: transferId, status: 'PENDING' },
    });

    if (!transfer) {
      const error = new Error('Pending transfer request not found.');
      error.status = 404;
      error.code = 'TRANSFER_NOT_FOUND';
      throw error;
    }

    // DEPT_HEAD: restrict rejection to transfers involving their own department
    if (requestingUser.role === 'DEPT_HEAD') {
      const targetEmp = await tx.employee.findUnique({
        where: { id: transfer.targetEmployeeId },
        select: { departmentId: true },
      });
      const reqEmp = await tx.employee.findUnique({
        where: { id: transfer.requestedById },
        select: { departmentId: true },
      });
      if (
        targetEmp?.departmentId !== requestingUser.departmentId &&
        reqEmp?.departmentId !== requestingUser.departmentId
      ) {
        const error = new Error(
          'Department Head can only reject transfers involving their own department.'
        );
        error.status = 403;
        error.code = 'FORBIDDEN_DEPARTMENT';
        throw error;
      }
    }

    const updated = await tx.transferRequest.update({
      where: { id: transferId },
      data: {
        status: 'REJECTED',
        approvedById: requestingUser.id,
        approvedAt: new Date(),
        reason: data.rejectReason || transfer.reason,
      },
      include: {
        asset: { select: { id: true, assetTag: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        targetEmployee: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    return updated;
  });
}

/**
 * Lists transfer requests with optional status filter.
 *
 * @param {Object} query - { status?, page, limit }
 * @param {Object} requestingUser
 * @returns {Promise<{ records, total, page, limit }>}
 */
export async function listTransferRequests(query, requestingUser) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = {};
  if (query.status) where.status = query.status;

  // DEPT_HEAD: see only transfers involving their department
  if (requestingUser.role === 'DEPT_HEAD') {
    where.OR = [
      { targetEmployee: { departmentId: requestingUser.departmentId } },
      { requestedBy: { departmentId: requestingUser.departmentId } },
    ];
  }

  const [records, total] = await Promise.all([
    prisma.transferRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: { select: { id: true, assetTag: true, name: true, status: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
        targetEmployee: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.transferRequest.count({ where }),
  ]);

  return { records, total, page, limit };
}

export default {
  createTransferRequest,
  approveTransferRequest,
  rejectTransferRequest,
  listTransferRequests,
};
