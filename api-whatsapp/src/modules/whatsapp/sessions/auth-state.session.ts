import fs from 'node:fs/promises';
import path from 'node:path';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import { env } from '../../../config/index.js';
import { logger } from '../../../shared/logger/index.js';

export async function ensureAuthDirectory(): Promise<void> {
  await fs.mkdir(env.authStatePath, { recursive: true });
}

export async function loadAuthState() {
  await ensureAuthDirectory();
  const { state, saveCreds } = await useMultiFileAuthState(env.authStatePath);
  logger.debug({ path: env.authStatePath }, 'Estado de autenticação carregado');
  return { state, saveCreds };
}

export async function clearAuthState(): Promise<void> {
  try {
    await fs.rm(env.authStatePath, { recursive: true, force: true });
    await ensureAuthDirectory();
    logger.info('Autenticação local removida');
  } catch (error) {
    logger.error({ error }, 'Falha ao limpar autenticação local');
    throw error;
  }
}

export function getAuthStatePath(): string {
  return path.resolve(env.authStatePath);
}
