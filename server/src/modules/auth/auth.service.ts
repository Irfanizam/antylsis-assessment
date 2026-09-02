import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../lib/password';
import { Conflict, InvalidCredentials } from '../../lib/errors';
import type { RegisterInput, LoginInput } from './auth.schema';

// Fields safe to return to a client — the password hash is never selected.
const publicUser = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUser }>;

export async function register(input: RegisterInput): Promise<PublicUser> {
  try {
    return await prisma.user.create({
      data: {
        email: input.email ?? null,
        phone: input.phone ?? null,
        passwordHash: await hashPassword(input.password),
        fullName: input.fullName ?? null,
      },
      select: publicUser,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw Conflict('IDENTIFIER_TAKEN', 'That email or phone is already registered');
    }
    throw e;
  }
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const identifier = input.identifier.trim();
  const where = identifier.includes('@')
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await prisma.user.findFirst({ where });
  const ok = await verifyPassword(input.password, user?.passwordHash ?? null);
  if (!user || !ok) throw InvalidCredentials();

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function getMe(userId: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id: userId }, select: publicUser });
}
