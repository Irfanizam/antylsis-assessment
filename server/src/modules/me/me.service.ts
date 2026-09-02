import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { Conflict, NotFound } from '../../lib/errors';
import type { UpdateProfileInput } from './me.schema';

const publicUser = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
  if (!user) throw NotFound('User not found');
  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      },
      select: publicUser,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw Conflict('IDENTIFIER_TAKEN', 'That email or phone is already in use');
    }
    throw e;
  }
}

export async function getSummary(userId: string) {
  const [pendingReceipts, approvedReceipts, availableVouchers] = await prisma.$transaction([
    prisma.receipt.count({ where: { userId, status: 'PENDING' } }),
    prisma.receipt.count({ where: { userId, status: 'APPROVED' } }),
    prisma.voucher.count({
      where: { userId, status: 'ACTIVE', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    }),
  ]);
  return { pendingReceipts, approvedReceipts, availableVouchers };
}
