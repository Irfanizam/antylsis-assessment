import type { RequestHandler } from 'express';
import { AUTH_COOKIE, verifyToken } from '../lib/jwt';
import { Unauthorized, Forbidden } from '../lib/errors';
import { prisma } from '../lib/prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: 'USER' | 'ADMIN' };
    }
  }
}

/** Requires a valid session cookie; attaches { id, role } from the token to req.user. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[AUTH_COOKIE] as string | undefined;
  if (!token) return next(Unauthorized());
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(Unauthorized('Session expired or invalid'));
  }
};

/**
 * Requires an admin. Re-reads the role from the database rather than trusting the token claim,
 * so a demoted admin cannot keep acting on an old token. Mount after requireAuth.
 */
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  if (!req.user) return next(Unauthorized());
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });
    if (!user || user.role !== 'ADMIN') return next(Forbidden());
    req.user.role = user.role;
    next();
  } catch (e) {
    next(e);
  }
};
