import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { updateProfileSchema } from './me.schema';
import * as controller from './me.controller';

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get('/', asyncHandler(controller.profile));
meRouter.patch('/', validate({ body: updateProfileSchema }), asyncHandler(controller.update));
meRouter.get('/summary', asyncHandler(controller.summary));
