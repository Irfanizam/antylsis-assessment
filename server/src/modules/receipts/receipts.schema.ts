import { z } from 'zod';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Multipart delivers every text field as a string, so amount is validated as a 2-decimal string.
export const createReceiptSchema = z
  .object({
    orderId: z.string().trim().min(1, 'Order number is required').max(64),
    purchaseDate: z.coerce
      .date({ errorMap: () => ({ message: 'Enter a valid purchase date' }) })
      .refine((d) => d.getTime() <= Date.now(), 'Purchase date cannot be in the future')
      .refine((d) => d.getTime() >= Date.now() - ONE_YEAR_MS, 'Purchase date is too old'),
    amount: z
      .string()
      .trim()
      .regex(/^\d{1,9}(\.\d{1,2})?$/, 'Enter a valid amount (up to 2 decimals)')
      .transform(Number)
      .refine((n) => n > 0 && n <= 1_000_000, 'Amount must be between 0 and 1,000,000'),
  })
  .strict();

export const listReceiptsSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type ListReceiptsQuery = z.infer<typeof listReceiptsSchema>;
