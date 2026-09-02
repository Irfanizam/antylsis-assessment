import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { validate } from '../../middleware/validate';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { listReceiptsQuery, rejectSchema, idParams } from './admin.schema';
import * as controller from './admin.controller';

export const adminRouter = Router();

// Fail-closed: role is enforced at the mount, so every admin route is protected by default.
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/summary', asyncHandler(controller.summary));
adminRouter.get('/receipts', validate({ query: listReceiptsQuery }), asyncHandler(controller.listReceipts));
adminRouter.get('/receipts/:id', validate({ params: idParams }), asyncHandler(controller.receiptDetail));
adminRouter.post('/receipts/:id/approve', validate({ params: idParams }), asyncHandler(controller.approve));
adminRouter.post('/receipts/:id/reject', validate({ params: idParams, body: rejectSchema }), asyncHandler(controller.reject));
