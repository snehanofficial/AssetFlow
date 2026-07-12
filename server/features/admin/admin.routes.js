import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../database/client.js';
import authenticateSession from '../../middlewares/auth.middleware.js';
import authorizeRoles from '../../middlewares/authorization.middleware.js';
import { logMutation } from '../../services/audit.service.js';
import { revokeAllUserTokens } from '../auth/auth.service.js';

const router = Router();

// Restrict all routes in this file to ADMIN
router.use(authenticateSession);
router.use(authorizeRoles('ADMIN'));

// Zod validation schemas
const roleUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'ASSET_MANAGER', 'DEPT_HEAD', 'EMPLOYEE']),
});

const statusUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

const departmentCreateSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters long.').max(100),
  parentId: z.string().uuid().nullable().optional(),
  headId: z.string().uuid().nullable().optional(),
});

const departmentUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Department name must be at least 2 characters long.').max(100),
  parentId: z.string().uuid().nullable().optional(),
  headId: z.string().uuid().nullable().optional(),
});

/**
 * Recursive helper to detect cyclical department structures
 */
async function checkCircularDependency(departmentId, proposedParentId) {
  if (!proposedParentId) return false;
  if (departmentId === proposedParentId) return true;

  let currentId = proposedParentId;
  while (currentId) {
    const dept = await prisma.department.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!dept) break;
    if (dept.parentId === departmentId) return true;
    currentId = dept.parentId;
  }
  return false;
}

/**
 * PATCH /api/v1/admin/employees/:id/role
 * Admin-only promotion/demotion of employee roles.
 */
router.patch('/employees/:id/role', async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const validated = roleUpdateSchema.parse(req.body);

    const employee = await prisma.employee.findUnique({
      where: { id: targetId },
    });

    if (!employee || employee.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Employee not found.' },
      });
    }

    if (employee.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INACTIVE_EMPLOYEE_PROMOTION',
          message: 'Target employee is inactive. Reactivate them first.',
        },
      });
    }

    // Prevent demoting sole admin
    if (employee.role === 'ADMIN' && validated.role !== 'ADMIN') {
      const adminCount = await prisma.employee.count({
        where: { role: 'ADMIN', status: 'ACTIVE', deletedAt: null },
      });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DEMOTE_SOLE_ADMIN',
            message: 'You cannot demote the sole Administrator in the system.',
          },
        });
      }
    }

    const updated = await prisma.employee.update({
      where: { id: targetId },
      data: { role: validated.role },
    });

    // Invalidate targets active sessions
    await revokeAllUserTokens(targetId);

    // Audit log
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'UPDATE',
      tableName: 'Employee',
      recordId: targetId,
      oldValue: { role: employee.role },
      newValue: { role: updated.role },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Employee role updated successfully. Target sessions invalidated.',
      data: {
        employee: {
          id: updated.id,
          email: updated.email,
          role: updated.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/admin/employees/:id/status
 * Deactivates or activates an employee account.
 */
router.patch('/employees/:id/status', async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const validated = statusUpdateSchema.parse(req.body);

    const employee = await prisma.employee.findUnique({
      where: { id: targetId },
    });

    if (!employee || employee.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Employee not found.' },
      });
    }

    if (validated.status === 'INACTIVE') {
      // Prevent deactivating self
      if (employee.id === req.user.id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANNOT_DEACTIVATE_SELF',
            message: 'You cannot deactivate your own account.',
          },
        });
      }

      // Check if employee is a Department Head
      const isHead = await prisma.department.count({
        where: { headId: targetId, status: 'ACTIVE', deletedAt: null },
      });
      if (isHead > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMPLOYEE_IS_DEPARTMENT_HEAD',
            message:
              'Cannot deactivate employee because they are currently a Department Head. Reassign the department head role first.',
          },
        });
      }
    }

    const updated = await prisma.employee.update({
      where: { id: targetId },
      data: { status: validated.status },
    });

    if (validated.status === 'INACTIVE') {
      await revokeAllUserTokens(targetId);
    }

    // Audit log
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'UPDATE',
      tableName: 'Employee',
      recordId: targetId,
      oldValue: { status: employee.status },
      newValue: { status: updated.status },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Employee account ${validated.status.toLowerCase()}d successfully.`,
      data: {
        employee: {
          id: updated.id,
          email: updated.email,
          status: updated.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/admin/departments
 * Admin-only: Creates a new corporate department.
 */
router.post('/departments', async (req, res, next) => {
  try {
    const validated = departmentCreateSchema.parse(req.body);

    // Verify parent exists if provided
    if (validated.parentId) {
      const parent = await prisma.department.findUnique({
        where: { id: validated.parentId },
      });
      if (!parent || parent.deletedAt !== null) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PARENT_DEPARTMENT_NOT_FOUND',
            message: 'The parent department specified does not exist.',
          },
        });
      }
    }

    // Verify head exists if provided
    if (validated.headId) {
      const head = await prisma.employee.findUnique({
        where: { id: validated.headId },
      });
      if (!head || head.deletedAt !== null) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'HEAD_EMPLOYEE_NOT_FOUND',
            message: 'The department head specified does not exist.',
          },
        });
      }
    }

    // Check duplicate name
    const existing = await prisma.department.findFirst({
      where: {
        name: { equals: validated.name, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_DEPARTMENT_NAME',
          message: 'A department with this name already exists.',
        },
      });
    }

    const department = await prisma.department.create({
      data: {
        name: validated.name,
        parentId: validated.parentId || null,
        headId: validated.headId || null,
        status: 'ACTIVE',
      },
    });

    // Audit log
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'INSERT',
      tableName: 'Department',
      recordId: department.id,
      newValue: department,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/admin/departments/:id
 * Admin-only: Updates department name, parent department, or head assignment.
 */
router.put('/departments/:id', async (req, res, next) => {
  try {
    const deptId = req.params.id;
    const validated = departmentUpdateSchema.parse(req.body);

    const department = await prisma.department.findUnique({
      where: { id: deptId },
    });

    if (!department || department.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Department not found.' },
      });
    }

    // Check duplicate name
    if (validated.name.toLowerCase() !== department.name.toLowerCase()) {
      const existing = await prisma.department.findFirst({
        where: {
          name: { equals: validated.name, mode: 'insensitive' },
          deletedAt: null,
          id: { not: deptId },
        },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DUPLICATE_DEPARTMENT_NAME',
            message: 'A department with this name already exists.',
          },
        });
      }
    }

    // Cycle check
    if (validated.parentId) {
      const isCyclic = await checkCircularDependency(deptId, validated.parentId);
      if (isCyclic) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CYCLIC_DEPARTMENT_HIERARCHY',
            message:
              'Cannot set parent department: this assignment would create a circular dependency.',
          },
        });
      }
    }

    const updated = await prisma.department.update({
      where: { id: deptId },
      data: {
        name: validated.name,
        parentId: validated.parentId || null,
        headId: validated.headId || null,
      },
    });

    // Audit log
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'UPDATE',
      tableName: 'Department',
      recordId: deptId,
      oldValue: department,
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
 * PATCH /api/v1/admin/departments/:id/status
 * Admin-only: Toggles active status of a department.
 */
router.patch('/departments/:id/status', async (req, res, next) => {
  try {
    const deptId = req.params.id;
    const validated = statusUpdateSchema.parse(req.body);

    const department = await prisma.department.findUnique({
      where: { id: deptId },
    });

    if (!department || department.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Department not found.' },
      });
    }

    if (validated.status === 'INACTIVE') {
      // Check active employees in department
      const activeMembers = await prisma.employee.count({
        where: { departmentId: deptId, status: 'ACTIVE', deletedAt: null },
      });
      if (activeMembers > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DEPARTMENT_HAS_ACTIVE_MEMBERS',
            message: 'Cannot deactivate department: active employees are still assigned to it.',
          },
        });
      }

      // Check active child departments
      const activeChildren = await prisma.department.count({
        where: { parentId: deptId, status: 'ACTIVE', deletedAt: null },
      });
      if (activeChildren > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DEPARTMENT_HAS_ACTIVE_CHILDREN',
            message: 'Cannot deactivate department: active sub-departments are still linked to it.',
          },
        });
      }
    }

    const updated = await prisma.department.update({
      where: { id: deptId },
      data: { status: validated.status },
    });

    // Audit log
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'UPDATE',
      tableName: 'Department',
      recordId: deptId,
      oldValue: { status: department.status },
      newValue: { status: updated.status },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `Department status updated to ${validated.status.toLowerCase()}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/admin/departments/:id
 * Admin-only: Soft deletes a department.
 */
router.delete('/departments/:id', async (req, res, next) => {
  try {
    const deptId = req.params.id;

    const department = await prisma.department.findUnique({
      where: { id: deptId },
    });

    if (!department || department.deletedAt !== null) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: 'Department not found.' },
      });
    }

    // Block delete if there are active sub-departments or members
    const activeMembers = await prisma.employee.count({
      where: { departmentId: deptId, deletedAt: null },
    });
    if (activeMembers > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DEPARTMENT_HAS_MEMBERS',
          message: 'Cannot delete department: employees are still assigned to it.',
        },
      });
    }

    const activeChildren = await prisma.department.count({
      where: { parentId: deptId, deletedAt: null },
    });
    if (activeChildren > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DEPARTMENT_HAS_CHILDREN',
          message: 'Cannot delete department: sub-departments are still linked to it.',
        },
      });
    }

    const deleted = await prisma.department.update({
      where: { id: deptId },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await logMutation({
      actorId: req.user.id,
      actorEmail: req.user.email,
      action: 'DELETE',
      tableName: 'Department',
      recordId: deptId,
      oldValue: department,
      newValue: deleted,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
