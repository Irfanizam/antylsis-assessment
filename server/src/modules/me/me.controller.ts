import type { Request, Response } from 'express';
import { Unauthorized } from '../../lib/errors';
import type { UpdateProfileInput } from './me.schema';
import * as service from './me.service';

export async function profile(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  res.json({ user: await service.getProfile(req.user.id) });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  res.json({ user: await service.updateProfile(req.user.id, req.body as UpdateProfileInput) });
}

export async function summary(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  res.json(await service.getSummary(req.user.id));
}
