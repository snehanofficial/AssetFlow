import prisma from '../database/client.js';

/**
 * Logs a database mutation event in the AuditLog table.
 *
 * @param {Object} params
 * @param {string} [params.actorId] - The ID of the employee performing the action.
 * @param {string} [params.actorEmail] - The email of the employee performing the action.
 * @param {string} params.action - The database operation (INSERT, UPDATE, DELETE).
 * @param {string} params.tableName - The table being mutated.
 * @param {string} params.recordId - The ID of the record being mutated.
 * @param {Object} [params.oldValue] - The state of the record before the mutation.
 * @param {Object} [params.newValue] - The state of the record after the mutation.
 * @param {string} [params.ipAddress] - The IP address of the client request.
 */
export async function logMutation({
  actorId,
  actorEmail,
  action,
  tableName,
  recordId,
  oldValue = null,
  newValue = null,
  ipAddress = null,
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        actorEmail: actorEmail || null,
        action,
        tableName,
        recordId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('❌ Failed to create audit log entry:', error);
  }
}

export default logMutation;
