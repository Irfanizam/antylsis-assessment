import multer from 'multer';
import { env } from '../config/env';

// Buffer the file in memory so we can verify its real type by magic bytes before storing it.
// The size cap is enforced here; exceeding it raises a MulterError → 413 in the error handler.
export const uploadReceipt = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_BYTES, files: 1 },
}).single('receipt');
