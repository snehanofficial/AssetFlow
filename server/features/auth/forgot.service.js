import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../../database/client.js';
import { logMutation } from '../../services/audit.service.js';

/**
 * Generates a password reset token for a given email if the user exists and is active.
 * Saves the token to the database with a 1-hour expiration.
 *
 * @param {string} email
 * @returns {Promise<Object>} The generated reset token record.
 */
export async function generateResetToken(email) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Verify email exists and is active
  const employee = await prisma.employee.findUnique({
    where: { email: normalizedEmail },
  });

  if (!employee || employee.deletedAt !== null) {
    const error = new Error('No employee account found with this email address.');
    error.code = 'EMAIL_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  if (employee.status === 'INACTIVE') {
    const error = new Error('This employee account has been deactivated.');
    error.code = 'ACCOUNT_DEACTIVATED';
    error.statusCode = 403;
    throw error;
  }

  // 2. Generate cryptographically secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // 3. Save to database
  const resetTokenRecord = await prisma.passwordResetToken.create({
    data: {
      token,
      employeeId: employee.id,
      expiresAt,
    },
    include: {
      employee: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return resetTokenRecord;
}

/**
 * Validates a password reset token and updates the employee's password.
 * Deletes the token and revokes active refresh tokens to force log out of other sessions.
 *
 * @param {string} token
 * @param {string} newPassword
 * @param {string} ipAddress
 * @returns {Promise<Object>} The updated employee.
 */
export async function resetPassword(token, newPassword, ipAddress) {
  // 1. Retrieve the token record and include the associated employee
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { employee: true },
  });

  // 2. Check if token exists
  if (!tokenRecord) {
    const error = new Error('Password reset token is invalid.');
    error.code = 'INVALID_TOKEN';
    error.statusCode = 400;
    throw error;
  }

  // 3. Verify token is not expired
  if (tokenRecord.expiresAt < new Date()) {
    // Delete the expired token to clean up
    await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } }).catch(() => {});
    const error = new Error('Password reset token has expired.');
    error.code = 'EXPIRED_TOKEN';
    error.statusCode = 400;
    throw error;
  }

  const employee = tokenRecord.employee;

  if (!employee || employee.deletedAt !== null || employee.status === 'INACTIVE') {
    const error = new Error('Employee account is no longer active.');
    error.code = 'ACCOUNT_INACTIVE';
    error.statusCode = 400;
    throw error;
  }

  // 4. Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 5. Update employee password, revoke all password reset tokens & active refresh tokens for the user in a transaction
  const updatedEmployee = await prisma.$transaction(async (tx) => {
    // Update employee password
    const updated = await tx.employee.update({
      where: { id: employee.id },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    // Revoke all password reset tokens for this employee
    await tx.passwordResetToken.deleteMany({
      where: { employeeId: employee.id },
    });

    // Revoke all active refresh tokens for this employee (forces log out across all sessions)
    await tx.refreshToken.deleteMany({
      where: { employeeId: employee.id },
    });

    return updated;
  });

  // 6. Log database mutation for password update
  await logMutation({
    actorId: employee.id,
    actorEmail: employee.email,
    action: 'UPDATE',
    tableName: 'Employee',
    recordId: employee.id,
    oldValue: { id: employee.id, email: employee.email },
    newValue: { id: updatedEmployee.id, email: updatedEmployee.email, status: updatedEmployee.status },
    ipAddress,
  });

  return updatedEmployee;
}
