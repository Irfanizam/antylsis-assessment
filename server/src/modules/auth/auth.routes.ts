import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { validate } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import { registerSchema, loginSchema } from './auth.schema';
import * as controller from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), asyncHandler(controller.register));
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), asyncHandler(controller.login));
authRouter.post('/logout', controller.logout);
authRouter.get('/me', requireAuth, asyncHandler(controller.me));
