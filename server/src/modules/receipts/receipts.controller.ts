import type { Request, Response } from 'express';
import { createReadStream } from 'node:fs';
import { resolveFile } from '../../lib/storage';
import { Unauthorized } from '../../lib/errors';
import type { ListReceiptsQuery } from './receipts.schema';
import * as service from './receipts.service';

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  const receipt = await service.createReceipt(req.user.id, req.body, req.file);
  res.status(201).location(`/api/receipts/${receipt.id}`).json({ receipt });
}

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  const result = await service.listMyReceipts(req.user.id, req.query as unknown as ListReceiptsQuery);
  res.json(result);
}

export async function detail(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  const receipt = await service.getMyReceipt(req.user.id, req.params.id!);
  res.json({ receipt });
}

export async function file(req: Request, res: Response): Promise<void> {
  if (!req.user) throw Unauthorized();
  const row = await service.getReceiptFileForViewer(req.user.id, req.user.role === 'ADMIN', req.params.id!);
  res.setHeader('Content-Type', row.fileMimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.fileOriginalName)}"`);
  createReadStream(resolveFile(row.fileKey)).pipe(res);
}
