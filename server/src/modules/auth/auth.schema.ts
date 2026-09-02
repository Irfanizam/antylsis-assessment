import { z } from 'zod';

const email = z.string().trim().toLowerCase().email();
const phone = z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number');
// Capped at 72 bytes because bcrypt silently ignores anything beyond that.
const password = z.string().min(8, 'Password must be at least 8 characters').max(72);

export const registerSchema = z
  .object({
    email: email.optional(),
    phone: phone.optional(),
    password,
    fullName: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .refine((d) => Boolean(d.email || d.phone), {
    message: 'Provide an email or a phone number',
    path: ['email'],
  });

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, 'Enter your email or phone'),
    password: z.string().min(1, 'Enter your password'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
