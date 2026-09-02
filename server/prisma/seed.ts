import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient, ReceiptStatus } from '@prisma/client';
import { env } from '../src/config/env';

const prisma = new PrismaClient();
const here = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(here, 'seed-assets');
const storageDir = resolve(process.cwd(), env.STORAGE_DIR);

function hash(password: string): string {
  return bcrypt.hashSync(password, env.BCRYPT_COST);
}

function voucherCode(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const bytes = randomBytes(8);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `LP-${out}`;
}

/** Copy a sample image into the runtime store under a random key. */
function placeSampleImage(name: string) {
  if (!existsSync(storageDir)) mkdirSync(storageDir, { recursive: true });
  const fileKey = `${randomUUID()}.png`;
  copyFileSync(join(assetsDir, name), join(storageDir, fileKey));
  return { fileKey, fileOriginalName: name, fileMimeType: 'image/png', fileSizeBytes: 1210 };
}

async function main() {
  const adminPassword = hash(env.SEED_ADMIN_PASSWORD);
  const userPassword = hash(env.SEED_USER_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    update: { passwordHash: adminPassword, role: 'ADMIN', fullName: 'Loyalty Admin' },
    create: { email: env.SEED_ADMIN_EMAIL, passwordHash: adminPassword, role: 'ADMIN', fullName: 'Loyalty Admin' },
  });
  const alice = await prisma.user.upsert({
    where: { email: 'alice@loyalty.test' },
    update: { passwordHash: userPassword, fullName: 'Alice Tan' },
    create: { email: 'alice@loyalty.test', passwordHash: userPassword, fullName: 'Alice Tan' },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@loyalty.test' },
    update: { passwordHash: userPassword, fullName: 'Bob Lim' },
    create: { email: 'bob@loyalty.test', passwordHash: userPassword, fullName: 'Bob Lim' },
  });

  // Reset seed users' receipts/vouchers so the seed is idempotent (vouchers first — FK is Restrict).
  const ids = [admin.id, alice.id, bob.id];
  await prisma.voucher.deleteMany({ where: { userId: { in: ids } } });
  await prisma.receipt.deleteMany({ where: { userId: { in: ids } } });

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

  // Alice has a spread of statuses; an approved receipt carries a voucher.
  const receipts: Array<{ order: string; amount: string; days: number; status: ReceiptStatus; img: string }> = [
    { order: 'ORD-1001', amount: '120.50', days: 3, status: 'PENDING', img: 'receipt-1.png' },
    { order: 'ORD-1002', amount: '58.00', days: 5, status: 'PENDING', img: 'receipt-2.png' },
    { order: 'ORD-1003', amount: '240.90', days: 10, status: 'APPROVED', img: 'receipt-3.png' },
    { order: 'ORD-1004', amount: '15.75', days: 14, status: 'REJECTED', img: 'receipt-1.png' },
  ];

  for (const r of receipts) {
    const file = placeSampleImage(r.img);
    const reviewed = r.status !== 'PENDING';
    const receipt = await prisma.receipt.create({
      data: {
        userId: alice.id,
        orderId: r.order,
        purchaseDate: daysAgo(r.days),
        amount: r.amount,
        status: r.status,
        ...file,
        reviewedById: reviewed ? admin.id : null,
        reviewedAt: reviewed ? daysAgo(r.days - 1) : null,
        reviewNote: r.status === 'REJECTED' ? 'Image too blurry to read the total.' : null,
      },
    });
    if (r.status === 'APPROVED') {
      const expiresAt = new Date(now.getTime() + env.VOUCHER_VALIDITY_DAYS * 86_400_000);
      await prisma.voucher.create({
        data: {
          code: voucherCode(),
          receiptId: receipt.id,
          userId: alice.id,
          amount: env.VOUCHER_VALUE.toFixed(2),
          expiresAt,
        },
      });
    }
  }

  console.log('\nSeed complete. Demo accounts:');
  console.table([
    { role: 'ADMIN', email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD },
    { role: 'USER', email: 'alice@loyalty.test', password: env.SEED_USER_PASSWORD },
    { role: 'USER (empty)', email: 'bob@loyalty.test', password: env.SEED_USER_PASSWORD },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
