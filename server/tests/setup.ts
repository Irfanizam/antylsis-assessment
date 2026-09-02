import { beforeEach, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';

// Start every test from a clean slate.
beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE "vouchers", "receipts", "users" RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await prisma.$disconnect();
});
