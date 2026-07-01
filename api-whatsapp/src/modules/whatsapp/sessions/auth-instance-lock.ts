import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../../config/index.js';
import { logger } from '../../../shared/logger/index.js';

const LOCK_FILE_NAME = '.instance.lock';

function isProcessAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readLockPid(lockPath: string): Promise<number | null> {
  try {
    const raw = await fs.readFile(lockPath, 'utf-8');
    const pid = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

export class AuthInstanceLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthInstanceLockError';
  }
}

export async function acquireAuthInstanceLock(
  authStatePath: string = env.authStatePath,
): Promise<{ release: () => Promise<void> }> {
  await fs.mkdir(authStatePath, { recursive: true });
  const lockPath = path.join(authStatePath, LOCK_FILE_NAME);

  const existingPid = await readLockPid(lockPath);
  if (existingPid !== null && existingPid !== process.pid && isProcessAlive(existingPid)) {
    throw new AuthInstanceLockError(
      `Outra instância (PID ${existingPid}) já utiliza a sessão em ${authStatePath}`,
    );
  }

  if (existingPid !== null && !isProcessAlive(existingPid)) {
    logger.warn({ stalePid: existingPid, lockPath }, 'Removendo lock obsoleto de instância anterior');
    await fs.unlink(lockPath).catch(() => undefined);
  }

  try {
    const handle = await fs.open(lockPath, 'wx');
    try {
      await handle.writeFile(String(process.pid), 'utf-8');
    } finally {
      await handle.close();
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EEXIST') {
      const pid = await readLockPid(lockPath);
      if (pid !== null && pid !== process.pid && isProcessAlive(pid)) {
        throw new AuthInstanceLockError(
          `Outra instância (PID ${pid}) já utiliza a sessão em ${authStatePath}`,
        );
      }
      await fs.unlink(lockPath).catch(() => undefined);
      const retryHandle = await fs.open(lockPath, 'wx');
      try {
        await retryHandle.writeFile(String(process.pid), 'utf-8');
      } finally {
        await retryHandle.close();
      }
    } else {
      throw error;
    }
  }

  logger.info({ pid: process.pid, authStatePath, lockPath }, 'Lock de instância adquirido');

  return {
    release: async () => {
      try {
        const pid = await readLockPid(lockPath);
        if (pid === process.pid) {
          await fs.unlink(lockPath);
          logger.info({ pid: process.pid, lockPath }, 'Lock de instância liberado');
        }
      } catch (releaseError) {
        logger.warn({ error: releaseError, lockPath }, 'Falha ao liberar lock de instância');
      }
    },
  };
}
