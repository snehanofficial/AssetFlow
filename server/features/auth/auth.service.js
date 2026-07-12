import jwt from 'jsonwebtoken';
import environment from '../../config/environment.js';
import prisma from '../../database/client.js';

/**
 * Generates an Access Token and a Refresh Token for the given employee.
 * The Refresh Token is stored in the database.
 *
 * @param {Object} employee
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
export async function generateTokens(employee) {
  // Payload for Access Token
  const payload = {
    id: employee.id,
    email: employee.email,
    role: employee.role,
    departmentId: employee.departmentId,
  };

  const accessToken = jwt.sign(payload, environment.JWT_ACCESS_SECRET, {
    expiresIn: '15m', // 15 minutes
  });

  const refreshToken = jwt.sign({ id: employee.id }, environment.JWT_REFRESH_SECRET, {
    expiresIn: '7d', // 7 days
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      employeeId: employee.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Verifies a refresh token and returns the corresponding employee if valid.
 *
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
export async function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, environment.JWT_REFRESH_SECRET);

    // Check if token exists in database and is not expired
    const record = await prisma.refreshToken.findFirst({
      where: {
        token,
        employeeId: decoded.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        employee: true,
      },
    });

    if (
      !record ||
      !record.employee ||
      record.employee.deletedAt !== null ||
      record.employee.status === 'INACTIVE'
    ) {
      return null;
    }

    return record.employee;
  } catch {
    return null;
  }
}

/**
 * Revokes/deletes a refresh token from the database.
 *
 * @param {string} token
 */
export async function revokeRefreshToken(token) {
  try {
    await prisma.refreshToken.delete({
      where: { token },
    });
  } catch {
    // Fail silently if token already deleted or not found
  }
}

/**
 * Revokes all refresh tokens for a specific employee.
 * (Forces logout across all sessions)
 *
 * @param {string} employeeId
 */
export async function revokeAllUserTokens(employeeId) {
  try {
    await prisma.refreshToken.deleteMany({
      where: { employeeId },
    });
  } catch (error) {
    console.error('Failed to revoke user tokens:', error);
  }
}
