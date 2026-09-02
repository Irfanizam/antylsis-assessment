import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { receiptsRouter } from './modules/receipts/receipts.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { vouchersRouter } from './modules/vouchers/vouchers.routes';
import { meRouter } from './modules/me/me.routes';

/**
 * Builds the Express app (no listen) so tests can import it with Supertest.
 * Feature routers are mounted here as they land (auth, receipts, vouchers, admin, docs).
 */
export function createApp(): Express {
  const app = express();

  // request id — echoed in every error body and log line
  app.use((req, _res, next) => {
    (req as express.Request & { id?: string }).id = randomUUID();
    next();
  });

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV, uptime: process.uptime() });
  });

  // --- feature routers ---
  app.use('/api/auth', authRouter);
  app.use('/api/receipts', receiptsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/vouchers', vouchersRouter);
  app.use('/api/me', meRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
