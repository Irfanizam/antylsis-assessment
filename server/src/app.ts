import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';

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

  // --- feature routers mount here (added per feature branch) ---

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
