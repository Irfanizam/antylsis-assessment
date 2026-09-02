import type { Request, Response } from 'express';
import * as service from './auth.service';
import { signToken, setAuthCookie, clearAuthCookie } from '../../lib/jwt';
import { NotFound, Unauthorized } from '../../lib/errors';

export async function register(req: Request, res: Response): Promise<void> {
  const user = await service.register(req.body);
  setAuthCookie(res, signToken({ sub: user.id, role: user.role }));
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response): Promise<void> {
  const user = await service.login(req.body);
  setAuthCookie(res, signToken({ sub: user.id, role: user.role }));
  res.json({ user });
}

export function logout(_req: Request, res: Response): void {
  clearAuthCookie(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  const user = await service.getMe(req.user.id);
  if (!user) throw NotFound('User not found');
  res.json({ user });
}
