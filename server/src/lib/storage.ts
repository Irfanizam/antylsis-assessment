import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';

// Files live outside any web-served directory; the only way out is the authorized route.
const root = resolve(process.cwd(), env.STORAGE_DIR);

export async function saveFile(buffer: Buffer, ext: string): Promise<string> {
  if (!existsSync(root)) await mkdir(root, { recursive: true });
  const safeExt = ext.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  const key = `${randomUUID()}.${safeExt}`;
  await writeFile(join(root, key), buffer);
  return key;
}

/** Resolve a stored key to an absolute path. basename() defends against path traversal. */
export function resolveFile(key: string): string {
  return join(root, basename(key));
}

export async function deleteFile(key: string): Promise<void> {
  try {
    await unlink(resolveFile(key));
  } catch {
    // best-effort cleanup
  }
}
