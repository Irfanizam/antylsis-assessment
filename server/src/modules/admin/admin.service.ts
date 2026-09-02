import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { Conflict, NotFound } from '../../lib/errors';
import { generateVoucherCode, voucherAmount, voucherExpiry } from '../../lib/voucher';
import type { ListReceiptsQuery } from './admin.schema';

/** Internal sentinel: the conditional UPDATE changed no rows (receipt not PENDING or gone). */
class NoRowUpdated extends Error {}

const receiptSelect = {
  id: true,
  orderId: true,
  purchaseDate: true,
  amount: true,
  currency: true,
  status: true,
  fileOriginalName: true,
  fileMimeType: true,
  reviewNote: true,
  reviewedAt: true,
  createdAt: true,
  user: { select: { id: true, email: true, phone: true, fullName: true } },
} satisfies Prisma.ReceiptSelect;

type ReceiptRow = Prisma.ReceiptGetPayload<{ select: typeof receiptSelect }>;

const voucherSelect = {
  id: true,
  code: true,
  receiptId: true,
  userId: true,
  amount: true,
  currency: true,
  status: true,
  issuedAt: true,
  expiresAt: true,
} satisfies Prisma.VoucherSelect;

function toAdminReceipt(r: ReceiptRow) {
  return {
    id: r.id,
    orderId: r.orderId,
    purchaseDate: r.purchaseDate,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    fileName: r.fileOriginalName,
    fileType: r.fileMimeType,
    fileUrl: `/api/receipts/${r.id}/file`,
    reviewNote: r.reviewNote,
    reviewedAt: r.reviewedAt,
    submittedAt: r.createdAt,
    submitter: r.user,
  };
}

export async function listReceipts(q: ListReceiptsQuery) {
  const where: Prisma.ReceiptWhereInput = q.status ? { status: q.status } : {};
  const [rows, total] = await Promise.all([
    prisma.receipt.findMany({
      where,
      select: receiptSelect,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.receipt.count({ where }),
  ]);
  return {
    data: rows.map(toAdminReceipt),
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) || 1 },
  };
}

export async function getReceiptDetail(id: string) {
  const row = await prisma.receipt.findUnique({ where: { id }, select: receiptSelect });
  if (!row) throw NotFound('Receipt not found');
  return toAdminReceipt(row);
}

/**
 * Approve a PENDING receipt and issue exactly one voucher, atomically and idempotently.
 * The guard is the conditional UPDATE (WHERE status = 'PENDING'): under concurrent approvals
 * only one transaction changes a row, so only one voucher is ever created. The UNIQUE(receipt_id)
 * constraint on vouchers is the backstop. A no-op update → 409 (or 404 if the receipt is gone).
 */
export async function approveReceipt(adminId: string, id: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.receipt.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedById: adminId, reviewedAt: new Date() },
      });
      if (updated.count === 0) throw new NoRowUpdated();

      const receipt = await tx.receipt.findUniqueOrThrow({ where: { id }, select: receiptSelect });
      const voucher = await tx.voucher.create({
        data: {
          code: generateVoucherCode(),
          receiptId: id,
          userId: receipt.user.id,
          amount: voucherAmount(),
          expiresAt: voucherExpiry(),
        },
        select: voucherSelect,
      });
      return { receipt, voucher };
    });
    return { receipt: toAdminReceipt(result.receipt), voucher: result.voucher };
  } catch (e) {
    if (e instanceof NoRowUpdated) throw await conflictOrNotFound(id);
    throw e;
  }
}

export async function rejectReceipt(adminId: string, id: string, reason?: string) {
  const updated = await prisma.receipt.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: 'REJECTED', reviewedById: adminId, reviewedAt: new Date(), reviewNote: reason ?? null },
  });
  if (updated.count === 0) throw await conflictOrNotFound(id);
  return getReceiptDetail(id);
}

export async function summary() {
  const [pendingReceipts, approvedReceipts, rejectedReceipts, vouchersIssued] = await prisma.$transaction([
    prisma.receipt.count({ where: { status: 'PENDING' } }),
    prisma.receipt.count({ where: { status: 'APPROVED' } }),
    prisma.receipt.count({ where: { status: 'REJECTED' } }),
    prisma.voucher.count(),
  ]);
  return { pendingReceipts, approvedReceipts, rejectedReceipts, vouchersIssued };
}

async function conflictOrNotFound(id: string) {
  const current = await prisma.receipt.findUnique({ where: { id }, select: { status: true } });
  if (!current) return NotFound('Receipt not found');
  return Conflict(
    'RECEIPT_ALREADY_PROCESSED',
    `This receipt has already been ${current.status.toLowerCase()}.`,
    { currentStatus: current.status },
  );
}
