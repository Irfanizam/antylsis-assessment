import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { listVouchersQuery, idParams } from './vouchers.schema';
import * as controller from './vouchers.controller';

export const vouchersRouter = Router();
vouchersRouter.use(requireAuth);

vouchersRouter.get('/', validate({ query: listVouchersQuery }), asyncHandler(controller.list));
vouchersRouter.get('/:id', validate({ params: idParams }), asyncHandler(controller.detail));
