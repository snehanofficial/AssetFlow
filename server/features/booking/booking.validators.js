import { z } from 'zod';

export const createBookingSchema = z
  .object({
    assetId: z.string().uuid('Invalid asset ID format.'),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Start date must be a valid date string.')
      .refine((val) => new Date(val) > new Date(Date.now() - 60000), 'Start date cannot be in the past.'), // allow slight offset for clock drift
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'End date must be a valid date string.'),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes cannot exceed 1000 characters.')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => new Date(data.endDate) > new Date(data.startDate),
    {
      message: 'End date must be after the start date.',
      path: ['endDate'],
    }
  );

export default createBookingSchema;
