import type { Request, Response } from 'express';
import { Unauthorized } from '../../lib/errors';
import type { ListVouchersQuery } from './vouchers.schema';
import * as service from './vouchers.service';

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  res.json(await service.listMyVouchers(req.user.id, req.query as unknown as ListVouchersQuery));
}

export async function detail(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  res.json({ voucher: await service.getMyVoucher(req.user.id, req.params.id!) });
}
