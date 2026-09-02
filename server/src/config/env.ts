import 'dotenv/config';
import { z } from 'zod';

/**
 * The ONLY place process.env is read. Parsed once at boot; the server refuses to
 * start with an invalid/missing config rather than running with `undefined` secrets.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),

  STORAGE_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5_242_880),

  VOUCHER_VALUE: z.coerce.number().positive().default(5),
  VOUCHER_VALIDITY_DAYS: z.coerce.number().int().positive().default(90),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@loyalty.test'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('Admin123!'),
  SEED_USER_PASSWORD: z.string().min(8).default('User123!'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
export type Env = typeof env;
