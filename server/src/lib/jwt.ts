import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env';

export const AUTH_COOKIE = 'auth_token';

export interface JwtPayload {
  sub: string;
  role: 'USER' | 'ADMIN';
}

export function signToken(payload: JwtPayload): string {
  const options = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions;
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  return decoded as JwtPayload;
}

const cookieBase = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 1000 });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, cookieBase);
}
