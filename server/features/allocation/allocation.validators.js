import { z } from 'zod';

/**
 * Zod validation schemas for Allocation feature.
 * REQ-ALC-01, REQ-ALC-02, REQ-ALC-03
 */

/**
 * Schema for creating a new allocation.
 */
export const createAllocationSchema = z.object({
  assetId: z
    .string({ required_error: 'Asset ID is required.' })
    .uuid('Asset ID must be a valid UUID.'),

  employeeId: z
    .string({ required_error: 'Employee ID is required.' })
    .uuid('Employee ID must be a valid UUID.'),

  expectedReturnAt: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || (!isNaN(Date.parse(val)) && new Date(val) > new Date()),
      'Expected return date must be a valid future date.'
    )
    .transform((val) => (val ? new Date(val) : null)),
});

/**
 * Schema for returning an asset (check-in).
 */
export const returnAssetSchema = z.object({
  returnCondition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR'], {
    required_error: 'Return condition is required.',
  }),

  returnNotes: z
    .string({ required_error: 'Return notes are required.' })
    .trim()
    .min(1, 'Return notes cannot be empty.'),
});

/**
 * Schema for creating a transfer request.
 */
export const createTransferSchema = z.object({
  assetId: z
    .string({ required_error: 'Asset ID is required.' })
    .uuid('Asset ID must be a valid UUID.'),

  targetEmployeeId: z
    .string({ required_error: 'Target employee ID is required.' })
    .uuid('Target employee ID must be a valid UUID.'),

  reason: z.string().trim().max(500).optional().nullable(),
});

/**
 * Schema for updating a transfer request status (approve/reject).
 */
export const updateTransferStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    required_error: 'Status must be APPROVED or REJECTED.',
  }),

  rejectReason: z.string().trim().max(500).optional().nullable(),
});

export default {
  createAllocationSchema,
  returnAssetSchema,
  createTransferSchema,
  updateTransferStatusSchema,
};
