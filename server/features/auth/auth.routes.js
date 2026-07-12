import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../database/client.js';
import { generateTokens, verifyRefreshToken, revokeRefreshToken } from './auth.service.js';
import { generateResetToken, resetPassword } from './forgot.service.js';
import { logMutation } from '../../services/audit.service.js';
import authenticateSession from '../../middlewares/auth.middleware.js';

const router = Router();

// Zod schemas for request validation
const signupSchema = z.object({
  email: z.string().trim().email('Invalid email address format.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/\d/, 'Password must contain at least 1 number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character.'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters long.').max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format.'),
  password: z.string().min(1, 'Password is required.'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address format.'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/\d/, 'Password must contain at least 1 number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character.'),
});

/**
 * POST /api/v1/auth/signup
 * Registers a new employee. Forces role to EMPLOYEE and status to ACTIVE.
 */
router.post('/signup', async (req, res, next) => {
  try {
    const validated = signupSchema.parse(req.body);

    // Check if email already exists
    const existing = await prisma.employee.findFirst({
      where: {
        email: {
          equals: validated.email.toLowerCase(),
          mode: 'insensitive',
        },
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

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create Employee record (force role: EMPLOYEE, status: ACTIVE)
    const employee = await prisma.employee.create({
      data: {
        email: validated.email.toLowerCase(),
        password: hashedPassword,
        name: validated.name,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });

    // Generate session tokens
    const { accessToken, refreshToken } = await generateTokens(employee);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log the registration event in the AuditLog
    await logMutation({
      actorId: employee.id,
      actorEmail: employee.email,
      action: 'INSERT',
      tableName: 'Employee',
      recordId: employee.id,
      newValue: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        status: employee.status,
      },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          role: employee.role,
          status: employee.status,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticates user credentials and initiates session.
 */
router.post('/login', async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    const employee = await prisma.employee.findUnique({
      where: {
        email: validated.email.toLowerCase(),
      },
    });

    if (!employee || employee.deletedAt !== null) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    // Verify password
    const match = await bcrypt.compare(validated.password, employee.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    // Check account status
    if (employee.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated.',
        },
      });
    }

    // Generate session tokens
    const { accessToken, refreshToken } = await generateTokens(employee);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refreshes an expired access token using the stored refresh token cookie.
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Refresh token is missing.',
        },
      });
    }

    const employee = await verifyRefreshToken(refreshToken);
    if (!employee) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Refresh token is invalid or expired.',
        },
      });
    }

    // Generate new access token
    const { accessToken } = await generateTokens(employee);

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/logout
 * Invalidates the refresh token and clears the cookie.
 */
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.clearCookie('refreshToken');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/me
 * Retrieves current logged-in employee profile.
 */
router.get('/me', authenticateSession, async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!employee || employee.deletedAt !== null || employee.status === 'INACTIVE') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_SESSION',
          message: 'User session has expired or is invalid.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: employee.id,
          email: employee.email,
          name: employee.name,
          role: employee.role,
          departmentId: employee.departmentId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Triggers password reset email simulation.
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const tokenRecord = await generateResetToken(validated.email);

    // Simulate email delivery by logging to console
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${tokenRecord.token}`;
    console.log(`[SIMULATED EMAIL] Password reset requested for ${tokenRecord.employee.email}. Reset URL: ${resetUrl}`);

    return res.status(200).json({
      success: true,
      message: 'Password reset link has been generated.',
      data: process.env.NODE_ENV !== 'production' ? {
        token: tokenRecord.token,
        resetUrl,
      } : undefined,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    next(error);
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Verifies token and updates employee password.
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    await resetPassword(validated.token, validated.password, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully updated.',
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }
    next(error);
  }
});

export default router;
