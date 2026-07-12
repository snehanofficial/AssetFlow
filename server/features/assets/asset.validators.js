import { z } from 'zod';

/**
 * Zod validation schemas for Asset feature.
 * REQ-AST-01: Validates asset registration inputs.
 */

/**
 * Schema for creating or updating an asset.
 * Core fields are validated; customFields is passed through as-is
 * (category-level custom field validation happens in the service layer).
 */
const assetMutationShape = {
  name: z
    .string({ required_error: 'Asset name is required.' })
    .trim()
    .min(2, 'Asset name must be at least 2 characters.')
    .max(255),

  categoryId: z
    .string({ required_error: 'Category is required.' })
    .uuid('Category ID must be a valid UUID.'),

  serialNumber: z
    .string({ required_error: 'Serial number is required.' })
    .trim()
    .min(1, 'Serial number cannot be empty.')
    .max(255),

  location: z
    .string({ required_error: 'Location is required.' })
    .trim()
    .min(1, 'Location cannot be empty.')
    .max(255),

  acquisitionDate: z
    .string({ required_error: 'Acquisition date is required.' })
    .refine((val) => !isNaN(Date.parse(val)), 'Acquisition date must be a valid date.'),

  acquisitionCost: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().nonnegative('Acquisition cost must be non-negative.').optional()
  ),

  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR'], {
    required_error: 'Condition is required.',
    invalid_type_error: 'Condition must be one of: NEW, GOOD, FAIR, POOR.',
  }),

  isBookable: z.preprocess(
    (val) =>
      val === 'true' || val === true ? true : val === 'false' || val === false ? false : val,
    z.boolean().default(false)
  ),

  customFields: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    }
    return val ?? {};
  }, z.record(z.unknown()).default({})),
};

export const createAssetSchema = z.object(assetMutationShape);
export const updateAssetSchema = z.object(assetMutationShape);

/**
 * Schema for filtering the asset directory.
 * REQ-AST-02: Query parameters for GET /assets.
 */
export const listAssetsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  search: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  status: z
    .enum([
      'AVAILABLE',
      'ALLOCATED',
      'UNDER_MAINTENANCE',
      'RESERVED',
      'LOST',
      'RETIRED',
      'DISPOSED',
    ])
    .optional(),
  departmentId: z.string().uuid().optional(),
  location: z.string().trim().optional(),
});

/**
 * Schema for the PATCH /assets/:id/status endpoint.
 * REQ-AST-03: Validate target status value.
 */
export const updateAssetStatusSchema = z.object({
  status: z.enum(
    ['AVAILABLE', 'ALLOCATED', 'UNDER_MAINTENANCE', 'RESERVED', 'LOST', 'RETIRED', 'DISPOSED'],
    { required_error: 'Status is required.' }
  ),
});

export default {
  createAssetSchema,
  updateAssetSchema,
  listAssetsQuerySchema,
  updateAssetStatusSchema,
};
