import { Prisma } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';
import { prisma } from '../../lib/prisma';
import { saveFile, deleteFile } from '../../lib/storage';
import { AppError, BadRequest, Conflict, NotFound } from '../../lib/errors';
import type { CreateReceiptInput, ListReceiptsQuery } from './receipts.schema';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const selectReceipt = {
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
} satisfies Prisma.ReceiptSelect;

type ReceiptRow = Prisma.ReceiptGetPayload<{ select: typeof selectReceipt }>;

export function toPublicReceipt(r: ReceiptRow) {
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
  };
}

export async function createReceipt(userId: string, input: CreateReceiptInput, file?: Express.Multer.File) {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw BadRequest('A receipt file is required');
  }
  const detected = await fileTypeFromBuffer(file.buffer);
  const ext = detected ? ALLOWED_TYPES[detected.mime] : undefined;
  if (!detected || !ext) {
    throw new AppError('UNSUPPORTED_FILE_TYPE', 415, 'Unsupported file. Upload a JPEG, PNG, WebP, or PDF.');
  }

  const fileKey = await saveFile(file.buffer, ext);
  try {
    const row = await prisma.receipt.create({
      data: {
        userId,
        orderId: input.orderId,
        purchaseDate: input.purchaseDate,
        amount: input.amount.toFixed(2),
        fileKey,
        fileOriginalName: file.originalname,
        fileMimeType: detected.mime,
        fileSizeBytes: file.size,
      },
      select: selectReceipt,
    });
    return toPublicReceipt(row);
  } catch (e) {
    await deleteFile(fileKey);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw Conflict('DUPLICATE_ORDER_ID', 'You have already submitted a receipt with this order id.');
    }
    throw e;
  }
}

export async function listMyReceipts(userId: string, q: ListReceiptsQuery) {
  const where: Prisma.ReceiptWhereInput = { userId, ...(q.status ? { status: q.status } : {}) };
  const [rows, total] = await Promise.all([
    prisma.receipt.findMany({
      where,
      select: selectReceipt,
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.receipt.count({ where }),
  ]);
  return {
    data: rows.map(toPublicReceipt),
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) || 1 },
  };
}

export async function getMyReceipt(userId: string, id: string) {
  const row = await prisma.receipt.findFirst({ where: { id, userId }, select: selectReceipt });
  if (!row) throw NotFound('Receipt not found');
  return toPublicReceipt(row);
}

/** Owner or admin only; anyone else gets 404 (no existence oracle). */
export async function getReceiptFileForViewer(viewerId: string, isAdmin: boolean, id: string) {
  const row = await prisma.receipt.findUnique({
    where: { id },
    select: { userId: true, fileKey: true, fileMimeType: true, fileOriginalName: true },
  });
  if (!row || (row.userId !== viewerId && !isAdmin)) throw NotFound('Receipt not found');
  return row;
}
