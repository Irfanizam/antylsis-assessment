import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/errorHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { uploadReceipt } from '../../middleware/upload';
import { createReceiptSchema, listReceiptsSchema } from './receipts.schema';
import * as controller from './receipts.controller';

const idParams = z.object({ id: z.string().uuid('Invalid receipt id') });

export const receiptsRouter = Router();
receiptsRouter.use(requireAuth);

// multer runs before body validation so the multipart text fields exist on req.body
receiptsRouter.post('/', uploadReceipt, validate({ body: createReceiptSchema }), asyncHandler(controller.create));
receiptsRouter.get('/', validate({ query: listReceiptsSchema }), asyncHandler(controller.list));
receiptsRouter.get('/:id', validate({ params: idParams }), asyncHandler(controller.detail));
receiptsRouter.get('/:id/file', validate({ params: idParams }), asyncHandler(controller.file));
