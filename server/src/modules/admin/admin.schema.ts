import { z } from 'zod';

export const listReceiptsQuery = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const rejectSchema = z
  .object({ reason: z.string().trim().min(1).max(500).optional() })
  .strict();

export const idParams = z.object({ id: z.string().uuid('Invalid receipt id') });

export type ListReceiptsQuery = z.infer<typeof listReceiptsQuery>;
export type RejectInput = z.infer<typeof rejectSchema>;
