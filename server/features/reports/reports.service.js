import prisma from '../../database/client.js';

/**
 * Computes dashboard aggregate analytics for reports.
 * Excludes deleted assets from calculation metrics.
 *
 * @returns {Promise<Object>} Aggregated analytics data.
 */
export async function getSummaryAnalytics() {
  // 1. Asset Status Distribution (Exclude deleted)
  const statusCounts = await prisma.asset.groupBy({
    by: ['status'],
    where: { deletedAt: null },
    _count: { id: true },
  });

  const statusDistribution = {
    AVAILABLE: 0,
    ALLOCATED: 0,
    UNDER_MAINTENANCE: 0,
    LOST: 0,
    RETIRED: 0,
    DISPOSED: 0,
  };
  statusCounts.forEach((c) => {
    if (c.status in statusDistribution) {
      statusDistribution[c.status] = c._count.id;
    }
  });

  // 2. Category Utilization rates
  // Gather active check-out counts vs total counts per category
  const categories = await prisma.assetCategory.findMany({
    include: {
      assets: {
        where: { deletedAt: null },
        select: { id: true, status: true },
      },
    },
  });

  const categoryUtilization = categories.map((cat) => {
    const total = cat.assets.length;
    const allocated = cat.assets.filter((a) => a.status === 'ALLOCATED').length;
    const rate = total > 0 ? Math.round((allocated / total) * 100) : 0;
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      totalAssets: total,
      allocatedAssets: allocated,
      utilizationRate: rate,
    };
  });

  // 3. Maintenance frequency grouped by Category
  const maintenanceCounts = await prisma.maintenanceRequest.groupBy({
    by: ['assetId'],
    _count: { id: true },
  });

  // Map asset counts back to categories
  const assets = await prisma.asset.findMany({
    where: { deletedAt: null },
    select: { id: true, categoryId: true },
  });

  const assetCategoryMap = {};
  assets.forEach((a) => {
    assetCategoryMap[a.id] = a.categoryId;
  });

  const categoryMaintenanceMap = {};
  categories.forEach((cat) => {
    categoryMaintenanceMap[cat.id] = { categoryName: cat.name, count: 0 };
  });

  maintenanceCounts.forEach((item) => {
    const catId = assetCategoryMap[item.assetId];
    if (catId && catId in categoryMaintenanceMap) {
      categoryMaintenanceMap[catId].count += item._count.id;
    }
  });

  const maintenanceFrequency = Object.values(categoryMaintenanceMap);

  // 4. Booking Peak Heatmap (bookings by Day of Week)
  const activeBookings = await prisma.booking.findMany({
    where: {
      status: {
        in: ['UPCOMING', 'ONGOING', 'COMPLETED'],
      },
    },
    select: { startDate: true },
  });

  const dayOfWeekCounts = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  activeBookings.forEach((b) => {
    const dayIndex = new Date(b.startDate).getDay();
    const dayName = days[dayIndex];
    dayOfWeekCounts[dayName]++;
  });

  const bookingHeatmap = Object.keys(dayOfWeekCounts).map((dayName) => ({
    day: dayName,
    count: dayOfWeekCounts[dayName],
  }));

  return {
    statusDistribution,
    categoryUtilization,
    maintenanceFrequency,
    bookingHeatmap,
  };
}

/**
 * Helper to convert items list to a standard CSV string format.
 *
 * @param {Array<Object>} items
 * @param {Array<string>} headers
 * @param {Array<string>} keys
 * @returns {string} CSV format file content.
 */
function convertToCSV(items, headers, keys) {
  const headerLine = headers.join(',') + '\n';
  const rows = items.map((item) =>
    keys
      .map((key) => {
        // Resolve nested keys if dot notation is supplied (e.g. category.name)
        let val = item;
        const keyParts = key.split('.');
        for (const part of keyParts) {
          val = val ? val[part] : '';
        }

        const cell = val ?? '';
        // Escape quotes
        const str = typeof cell === 'string' ? cell : String(cell);
        const escaped = `"${str.replace(/"/g, '""')}"`;
        return escaped;
      })
      .join(',')
  );
  return headerLine + rows.join('\n');
}

/**
 * Fetches collections and exports flat CSV spreadsheets.
 *
 * @param {string} type - 'assets' | 'bookings' | 'maintenance'
 * @returns {Promise<Object>} Object containing csv string content and filename.
 */
export async function exportDataStream({ type }) {
  let csvContent = '';
  let filename = '';

  if (type === 'assets') {
    const assets = await prisma.asset.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { assetTag: 'asc' },
    });

    const headers = [
      'Asset Tag',
      'Asset Name',
      'Serial Number',
      'Category',
      'Status',
      'Condition',
      'Location',
      'Bookable',
      'Acquisition Cost',
      'Acquisition Date',
    ];
    const keys = [
      'assetTag',
      'name',
      'serialNumber',
      'category.name',
      'status',
      'condition',
      'location',
      'isBookable',
      'acquisitionCost',
      'acquisitionDate',
    ];

    csvContent = convertToCSV(assets, headers, keys);
    filename = `assets_registry_${Date.now()}.csv`;
  } else if (type === 'bookings') {
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['UPCOMING', 'ONGOING', 'COMPLETED'],
        },
      },
      include: {
        asset: true,
        bookedBy: true,
      },
      orderBy: { startDate: 'asc' },
    });

    const headers = [
      'Asset Tag',
      'Asset Name',
      'Booker Name',
      'Booker Email',
      'Start Date',
      'End Date',
      'Status',
      'Notes',
    ];
    const keys = [
      'asset.assetTag',
      'asset.name',
      'bookedBy.name',
      'bookedBy.email',
      'startDate',
      'endDate',
      'status',
      'notes',
    ];

    csvContent = convertToCSV(bookings, headers, keys);
    filename = `bookings_log_${Date.now()}.csv`;
  } else if (type === 'maintenance') {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        asset: true,
        requestedBy: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Asset Tag',
      'Asset Name',
      'Requester Name',
      'Priority',
      'Status',
      'Description',
      'Technician Name',
      'Resolution Notes',
      'Completed Date',
    ];
    const keys = [
      'asset.assetTag',
      'asset.name',
      'requestedBy.name',
      'priority',
      'status',
      'description',
      'assignedTo.name',
      'resolutionNotes',
      'completedAt',
    ];

    csvContent = convertToCSV(requests, headers, keys);
    filename = `maintenance_tickets_${Date.now()}.csv`;
  } else {
    const error = new Error('Invalid export data type.');
    error.code = 'INVALID_EXPORT_TYPE';
    error.statusCode = 400;
    throw error;
  }

  return { csvContent, filename };
}
