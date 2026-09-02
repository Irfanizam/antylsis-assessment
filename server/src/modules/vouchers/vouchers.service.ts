import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotFound } from '../../lib/errors';
import type { ListVouchersQuery } from './vouchers.schema';

const voucherSelect = {
  id: true,
  code: true,
  amount: true,
  currency: true,
  status: true,
  issuedAt: true,
  expiresAt: true,
  redeemedAt: true,
  receipt: {
    select: { id: true, orderId: true, purchaseDate: true, amount: true, status: true },
  },
} satisfies Prisma.VoucherSelect;

type VoucherRow = Prisma.VoucherGetPayload<{ select: typeof voucherSelect }>;

function toPublicVoucher(v: VoucherRow) {
  const isAvailable = v.status === 'ACTIVE' && (!v.expiresAt || v.expiresAt.getTime() > Date.now());
  return {
    id: v.id,
    code: v.code,
    amount: v.amount,
    currency: v.currency,
    status: v.status,
    isAvailable,
    issuedAt: v.issuedAt,
    expiresAt: v.expiresAt,
    redeemedAt: v.redeemedAt,
    receipt: v.receipt,
  };
}

export async function listMyVouchers(userId: string, q: ListVouchersQuery) {
  const where: Prisma.VoucherWhereInput = { userId, ...(q.status ? { status: q.status } : {}) };
  const [rows, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      select: voucherSelect,
      orderBy: { issuedAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.voucher.count({ where }),
  ]);
  return {
    data: rows.map(toPublicVoucher),
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) || 1 },
  };
}

export async function getMyVoucher(userId: string, id: string) {
  const row = await prisma.voucher.findFirst({ where: { id, userId }, select: voucherSelect });
  if (!row) throw NotFound('Voucher not found');
  return toPublicVoucher(row);
}
