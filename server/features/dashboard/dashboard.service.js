import prisma from '../../database/client.js';

/**
 * Fetch dashboard metrics for a user.
 * Filters counts based on role (Employee vs Managers).
 *
 * @param {Object} user - The authenticated user session object.
 * @returns {Promise<Object>} The aggregated metrics object.
 */
export async function getDashboardMetrics(user) {
  const userId = user.id;
  const isManager = ['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD'].includes(user.role);
  const now = new Date();

  if (isManager) {
    // 1. Manager view: Company-wide metrics
    const [
      availableCount,
      allocatedCount,
      maintenanceCount,
      bookingsCount,
      transfersCount,
      overdueItems,
    ] = await Promise.all([
      // Available Assets
      prisma.asset.count({
        where: {
          status: 'AVAILABLE',
          deletedAt: null,
        },
      }),
      // Active Allocations
      prisma.assetAllocation.count({
        where: {
          status: 'ACTIVE',
        },
      }),
      // Open Maintenance Requests
      prisma.maintenanceRequest.count({
        where: {
          status: {
            in: ['PENDING', 'APPROVED', 'IN_PROGRESS'],
          },
        },
      }),
      // Active Bookings
      prisma.booking.count({
        where: {
          status: {
            in: ['UPCOMING', 'ONGOING'],
          },
        },
      }),
      // Pending Transfers
      prisma.transferRequest.count({
        where: {
          status: 'PENDING',
        },
      }),
      // Overdue Returns
      prisma.assetAllocation.findMany({
        where: {
          OR: [
            { status: 'OVERDUE' },
            {
              status: 'ACTIVE',
              expectedReturnAt: { lt: now },
            },
          ],
        },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetTag: true,
            },
          },
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      available: availableCount,
      allocated: allocatedCount,
      maintenanceToday: maintenanceCount,
      activeBookings: bookingsCount,
      pendingTransfers: transfersCount,
      overdueReturns: overdueItems.map((item) => ({
        id: item.id,
        expectedReturnAt: item.expectedReturnAt,
        asset: item.asset,
        employee: item.employee,
      })),
    };
  } else {
    // 2. Employee view: Personal scoped metrics
    const [
      availableCount,
      allocatedCount,
      maintenanceCount,
      bookingsCount,
      transfersCount,
      overdueItems,
    ] = await Promise.all([
      // Shared Bookable Assets that are Available
      prisma.asset.count({
        where: {
          status: 'AVAILABLE',
          isBookable: true,
          deletedAt: null,
        },
      }),
      // Personal Allocations
      prisma.assetAllocation.count({
        where: {
          employeeId: userId,
          status: 'ACTIVE',
        },
      }),
      // Maintenance raised by or assigned to employee
      prisma.maintenanceRequest.count({
        where: {
          OR: [
            { requestedById: userId },
            { assignedToId: userId },
          ],
          status: {
            in: ['PENDING', 'APPROVED', 'IN_PROGRESS'],
          },
        },
      }),
      // Personal Bookings
      prisma.booking.count({
        where: {
          bookedById: userId,
          status: {
            in: ['UPCOMING', 'ONGOING'],
          },
        },
      }),
      // Personal Pending Transfers (inbound or outbound)
      prisma.transferRequest.count({
        where: {
          status: 'PENDING',
          OR: [
            { requestedById: userId },
            { targetEmployeeId: userId },
          ],
        },
      }),
      // Personal Overdue Returns
      prisma.assetAllocation.findMany({
        where: {
          employeeId: userId,
          OR: [
            { status: 'OVERDUE' },
            {
              status: 'ACTIVE',
              expectedReturnAt: { lt: now },
            },
          ],
        },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetTag: true,
            },
          },
        },
      }),
    ]);

    return {
      available: availableCount,
      allocated: allocatedCount,
      maintenanceToday: maintenanceCount,
      activeBookings: bookingsCount,
      pendingTransfers: transfersCount,
      overdueReturns: overdueItems.map((item) => ({
        id: item.id,
        expectedReturnAt: item.expectedReturnAt,
        asset: item.asset,
      })),
    };
  }
}
