import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { acquireAuthInstanceLock } from './auth-instance-lock.js';

const tempDirs: string[] = [];

async function createTempAuthDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'passirence-auth-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
});

describe('auth-instance-lock', () => {
  it('adquire e libera lock com PID atual', async () => {
    const dir = await createTempAuthDir();
    const lock = await acquireAuthInstanceLock(dir);
    await expect(lock.release()).resolves.toBeUndefined();
  });

  it('remove lock obsoleto de processo inexistente', async () => {
    const dir = await createTempAuthDir();
    const lockPath = path.join(dir, '.instance.lock');

    await fs.writeFile(lockPath, '999999999', 'utf-8');

    const lock = await acquireAuthInstanceLock(dir);
    await expect(lock.release()).resolves.toBeUndefined();
  });
});
