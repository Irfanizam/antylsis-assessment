import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

// Fixed test database URL (kept in step with vitest.config.ts). Hardcoded here because
// globalSetup does not inherit the per-test `env` block.
const testUrl = 'postgresql://receipthub:receipthub@localhost:5544/receipthub_test';

// Runs once before the whole suite: ensures the test database exists and is migrated.
export default async function setup(): Promise<void> {
  // Connect to the maintenance database to create the test database if it's missing.
  const adminUrl = testUrl.replace(/\/([^/?]+)(\?.*)?$/, '/postgres$2');
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    await admin.$executeRawUnsafe('CREATE DATABASE "receipthub_test"');
  } catch (e) {
    const msg = String((e as { message?: string })?.message ?? e);
    if (!msg.includes('already exists') && !msg.includes('42P04')) {
      console.warn('Could not create receipthub_test (continuing):', msg.split('\n')[0]);
    }
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testUrl },
  });
}
