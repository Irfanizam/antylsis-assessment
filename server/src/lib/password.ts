import bcrypt from 'bcryptjs';
import { env } from '../config/env';

// A precomputed hash so the "no such user" path costs the same as a real comparison —
// otherwise response timing would reveal which identifiers exist.
const DUMMY_HASH = bcrypt.hashSync('constant-time-placeholder', env.BCRYPT_COST);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  const matched = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return hash !== null && matched;
}
