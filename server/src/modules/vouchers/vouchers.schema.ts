import { z } from 'zod';

export const listVouchersQuery = z.object({
  status: z.enum(['ACTIVE', 'REDEEMED', 'EXPIRED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParams = z.object({ id: z.string().uuid('Invalid voucher id') });

export type ListVouchersQuery = z.infer<typeof listVouchersQuery>;
