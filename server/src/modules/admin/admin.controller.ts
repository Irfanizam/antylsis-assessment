import type { Request, Response } from 'express';
import { Unauthorized } from '../../lib/errors';
import type { ListReceiptsQuery, RejectInput } from './admin.schema';
import * as service from './admin.service';

export async function summary(_req: Request, res: Response): Promise<void> {
  res.json(await service.summary());
}

export async function listReceipts(req: Request, res: Response): Promise<void> {
  res.json(await service.listReceipts(req.query as unknown as ListReceiptsQuery));
}

export async function receiptDetail(req: Request, res: Response): Promise<void> {
  res.json({ receipt: await service.getReceiptDetail(req.params.id!) });
}

export async function approve(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  res.json(await service.approveReceipt(req.user.id, req.params.id!));
}

export async function reject(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  const { reason } = req.body as RejectInput;
  res.json({ receipt: await service.rejectReceipt(req.user.id, req.params.id!, reason) });
}
