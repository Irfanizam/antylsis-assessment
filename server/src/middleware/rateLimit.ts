import rateLimit from 'express-rate-limit';

/** Throttles auth attempts (login/register) to blunt brute-force and credential stuffing. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' },
    });
  },
});
