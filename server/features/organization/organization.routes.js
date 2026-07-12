import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../database/client.js';
import authenticateSession from '../../middlewares/auth.middleware.js';
import authorizeRoles from '../../middlewares/authorization.middleware.js';
import { logMutation } from '../../services/audit.service.js';

const router = Router();

// Secure all endpoints in this file - require active login
router.use(authenticateSession);

// Zod schema for asset category schema validation
const customFieldSchema = z.object({
  name: z.string().trim().min(1, 'Attribute name is required.'),
  type: z.enum(['string', 'number', 'boolean']),
  required: z.boolean(),
});

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters long.').max(100),
  customFieldsSchema: z.array(customFieldSchema).default([]),
});

const employeeUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long.').max(100),
  email: z.string().trim().email('Invalid email address format.'),
  departmentId: z.string().uuid().nullable().optional(),
});

/**
 * Helper to build recursive tree hierarchy from flat departments list
 */
function buildDepartmentTree(depts, parentId = null) {
  return depts
    .filter((d) => d.parentId === parentId)
    .map((d) => ({
      ...d,
      children: buildDepartmentTree(depts, d.id),
    }));
}

/**
 * ==========================================
 * DEPARTMENTS ENDPOINTS
 * ==========================================
 */

/**
 * GET /api/v1/organization/departments
 * Retrieves a list of departments. Supports search, pagination, and tree structure hierarchy mapping.
 */
router.get('/departments', async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const status = req.query.status;
    const tree = req.query.tree === 'true';

    const where = {
      deletedAt: null,
      name: {
        contains: search,
        mode: 'insensitive',
      },
    };

    if (status) {
      where.status = status;
    }

    const depts = await prisma.department.findMany({
      where,
      include: {
        head: {
          select: { id: true, name: true, email: true },
        },
        parent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (tree) {
      const departmentTree = buildDepartmentTree(depts, null);
      return res.status(200).json({
        success: true,
        data: {
          records: departmentTree,
          total: departmentTree.length,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        records: depts,
        total: depts.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/organization/departments/:id
 * Fetches single department details.
 */
router.get('/departments/:id', async (req, res, next) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        head: {
          select: { id: true, name: true, email: true },
        },
        parent: {
          select: { id: true, name: true },
        },
        children: {
          where: { deletedAt: null },
          select: { id: true, name: true, status: true },
        },
        employees: {
          where: { deletedAt: null },
          select: { id: true, name: true, email: true, role: true, status: true },
        },
      },
    });

    if (!dept || dept.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Department not found.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: dept,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ==========================================
 * EMPLOYEES ENDPOINTS
 * ==========================================
 */

/**
 * GET /api/v1/organization/employees
 * Paginated and searchable employee directory list.
 */
router.get('/employees', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = req.query.search || '';
    const departmentId = req.query.departmentId;
    const role = req.query.role;
    const status = req.query.status;

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

    const where = {
      deletedAt: null,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };

    if (departmentId) where.departmentId = departmentId;
    if (role) where.role = role;
    if (status) where.status = status;

    const total = await prisma.employee.count({ where });

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return res.status(200).json({
      success: true,
      data: {
        records: employees,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/organization/employees/:id
 * Fetches single employee details.
 */
router.get('/employees/:id', async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        departmentId: true,
        createdAt: true,
        department: {
          select: { id: true, name: true },
        },
      },
    });

    if (!employee || employee.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Employee not found.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/organization/employees/:id
 * Admin-only: Updates standard employee details.
 */
router.put('/employees/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const validated = employeeUpdateSchema.parse(req.body);

    const employee = await prisma.employee.findUnique({
      where: { id: targetId },
    });

    if (!employee || employee.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Employee not found.' },
      });
    }

    // Email unique check
    if (validated.email.toLowerCase() !== employee.email.toLowerCase()) {
      const existing = await prisma.employee.findFirst({
        where: {
          email: { equals: validated.email, mode: 'insensitive' },
          deletedAt: null,
          id: { not: targetId },
        },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'An account with this email address already exists.',
          },
        });
      }
    }

    // Verify department if provided
    if (validated.departmentId) {
      const dept = await prisma.department.findUnique({
        where: { id: validated.departmentId },
      });
      if (!dept || dept.deletedAt !== null) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DEPARTMENT_NOT_FOUND',
            message: 'The specified department does not exist.',
          },
        });
      }
    }

    const updated = await prisma.employee.update({
      where: { id: targetId },
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        departmentId: validated.departmentId || null,
      },
    });

    // Audit log
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'UPDATE',
      tableName: 'Employee',
      recordId: targetId,
      oldValue: { name: employee.name, email: employee.email, departmentId: employee.departmentId },
      newValue: { name: updated.name, email: updated.email, departmentId: updated.departmentId },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/organization/employees/:id
 * Admin-only: Soft deletes employee account.
 */
router.delete('/employees/:id', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const targetId = req.params.id;

    const employee = await prisma.employee.findUnique({
      where: { id: targetId },
    });

    if (!employee || employee.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Employee not found.' },
      });
    }

    // Prevent deleting self
    if (employee.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: { code: 'CANNOT_DELETE_SELF', message: 'You cannot delete your own account.' },
      });
    }

    // Check if employee heads any department
    const headsCount = await prisma.department.count({
      where: { headId: targetId, deletedAt: null },
    });
    if (headsCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPLOYEE_IS_DEPARTMENT_HEAD',
          message:
            'Cannot delete employee because they are currently a Department Head. Reassign the department head role first.',
        },
      });
    }

    // REQ-EMP-01: Block deletion if employee holds active asset allocations
    const activeAllocations = await prisma.assetAllocation.count({
      where: { employeeId: targetId, status: 'ACTIVE' },
    });
    if (activeAllocations > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPLOYEE_HAS_ACTIVE_ALLOCATIONS',
          message: `Cannot delete employee with active allocations. Reassign ${activeAllocations} asset(s) first.`,
        },
      });
    }

    const deleted = await prisma.employee.update({
      where: { id: targetId },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    // Log mutation
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'DELETE',
      tableName: 'Employee',
      recordId: targetId,
      oldValue: employee,
      newValue: deleted,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee soft-deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * ==========================================
 * ASSET CATEGORIES ENDPOINTS
 * ==========================================
 */

/**
 * GET /api/v1/organization/categories
 * Lists asset categories.
 */
router.get('/categories', async (req, res, next) => {
  try {
    const search = req.query.search || '';

    const categories = await prisma.assetCategory.findMany({
      where: {
        deletedAt: null,
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        records: categories,
        total: categories.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/organization/categories/:id
 * Fetches details of a single category.
 */
router.get('/categories/:id', async (req, res, next) => {
  try {
    const category = await prisma.assetCategory.findUnique({
      where: { id: req.params.id },
    });

    if (!category || category.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Category not found.' },
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/organization/categories
 * Creates a new category. ADMIN or ASSET_MANAGER.
 */
router.post('/categories', authorizeRoles('ADMIN', 'ASSET_MANAGER'), async (req, res, next) => {
  try {
    const validated = categorySchema.parse(req.body);

    const existing = await prisma.assetCategory.findFirst({
      where: {
        name: { equals: validated.name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_CATEGORY_NAME',
          message: 'An asset category with this name already exists.',
        },
      });
    }

    const category = await prisma.assetCategory.create({
      data: {
        name: validated.name,
        customFieldsSchema: validated.customFieldsSchema,
      },
    });

    // Audit log
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'INSERT',
      tableName: 'AssetCategory',
      recordId: category.id,
      newValue: category,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/organization/categories/:id
 * Updates an asset category. ADMIN or ASSET_MANAGER.
 */
router.put('/categories/:id', authorizeRoles('ADMIN', 'ASSET_MANAGER'), async (req, res, next) => {
  try {
    const catId = req.params.id;
    const validated = categorySchema.parse(req.body);

    const category = await prisma.assetCategory.findUnique({
      where: { id: catId },
    });

    if (!category || category.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Category not found.' },
      });
    }

    // Check duplicate name
    if (validated.name.toLowerCase() !== category.name.toLowerCase()) {
      const existing = await prisma.assetCategory.findFirst({
        where: {
          name: { equals: validated.name, mode: 'insensitive' },
          deletedAt: null,
          id: { not: catId },
        },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_CATEGORY_NAME',
            message: 'An asset category with this name already exists.',
          },
        });
      }
    }

    const updated = await prisma.assetCategory.update({
      where: { id: catId },
      data: {
        name: validated.name,
        customFieldsSchema: validated.customFieldsSchema,
      },
    });

    // Audit log
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'UPDATE',
      tableName: 'AssetCategory',
      recordId: catId,
      oldValue: category,
      newValue: updated,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/organization/categories/:id
 * Soft deletes category. ADMIN or ASSET_MANAGER.
 */
router.delete(
  '/categories/:id',
  authorizeRoles('ADMIN', 'ASSET_MANAGER'),
  async (req, res, next) => {
    try {
      const catId = req.params.id;

      const category = await prisma.assetCategory.findUnique({
        where: { id: catId },
      });

      if (!category || category.deletedAt !== null) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'Category not found.' },
        });
      }

      const deleted = await prisma.assetCategory.update({
        where: { id: catId },
        data: { deletedAt: new Date() },
      });

      // Audit log
      await logMutation({
        actorId: req.user.id,
        actorEmail: req.user.email,
        action: 'DELETE',
        tableName: 'AssetCategory',
        recordId: catId,
        oldValue: category,
        newValue: deleted,
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
