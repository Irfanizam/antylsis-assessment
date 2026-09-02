import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number').optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Provide at least one field to update' });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
