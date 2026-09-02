import { randomBytes } from 'node:crypto';
import { env } from '../config/env';

// Crockford-ish base32 (no I/L/O/U) — human-readable, ~80 bits of entropy.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateVoucherCode(): string {
  const bytes = randomBytes(10);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `LP-${out}`;
}

/** Voucher worth — a product decision kept in config, snapshotted onto each voucher at issue time. */
export function voucherAmount(): string {
  return env.VOUCHER_VALUE.toFixed(2);
}

export function voucherExpiry(): Date {
  return new Date(Date.now() + env.VOUCHER_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
}
