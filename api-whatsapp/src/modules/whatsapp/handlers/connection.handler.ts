import type { ConnectionState, WAConnectionState } from '@whiskeysockets/baileys';
import { DisconnectReason } from '@whiskeysockets/baileys';
import type { Boom } from '@hapi/boom';
import { logger } from '../../../shared/logger/index.js';
import type { ConnectionStatus } from '../types/index.js';

export interface ConnectionHandlerCallbacks {
  onQr: (qr: string) => void;
  onConnected: () => void;
  onDisconnected: (status: ConnectionStatus) => void;
  onReconnect: () => void;
  onLoggedOut: () => void;
  onMaxReconnectAttempts: () => void;
}

export function mapWaConnectionState(connection?: WAConnectionState): ConnectionStatus {
  switch (connection) {
    case 'open':
      return 'connected';
    case 'connecting':
      return 'connecting';
    case 'close':
      return 'disconnected';
    default:
      return 'disconnected';
  }
}

function getDisconnectDetails(lastDisconnect: ConnectionState['lastDisconnect']): {
  statusCode: number | undefined;
  errorMessage: string;
} {
  const error = lastDisconnect?.error as Boom | undefined;
  const statusCode = error?.output?.statusCode;
  const errorMessage =
    error?.message ??
    (lastDisconnect?.error instanceof Error
      ? lastDisconnect.error.message
      : String(lastDisconnect?.error ?? 'desconhecido'));

  return { statusCode, errorMessage };
}

export function handleConnectionUpdate(
  update: Partial<ConnectionState>,
  callbacks: ConnectionHandlerCallbacks,
  reconnectAttempts: { current: number },
  maxReconnectAttempts: number,
): void {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    callbacks.onQr(qr);
    logger.info('QR Code gerado');
  }

  if (connection === 'open') {
    reconnectAttempts.current = 0;
    callbacks.onConnected();
    logger.info({ pid: process.pid }, 'WhatsApp conectado');
  }

  if (connection === 'close') {
    const { statusCode, errorMessage } = getDisconnectDetails(lastDisconnect);
    const isLoggedOut = statusCode === DisconnectReason.loggedOut;

    if (isLoggedOut) {
      logger.warn({ statusCode, errorMessage, pid: process.pid }, 'Sessão encerrada (logout remoto)');
      callbacks.onLoggedOut();
      return;
    }

    callbacks.onDisconnected('disconnected');

    if (reconnectAttempts.current >= maxReconnectAttempts) {
      logger.error(
        { attempts: reconnectAttempts.current, statusCode, errorMessage, pid: process.pid },
        'Limite de reconexões atingido',
      );
      callbacks.onMaxReconnectAttempts();
      return;
    }

    reconnectAttempts.current += 1;
    logger.warn(
      {
        attempt: reconnectAttempts.current,
        maxReconnectAttempts,
        statusCode,
        errorMessage,
        pid: process.pid,
      },
      'Conexão perdida, tentando reconectar',
    );
    callbacks.onReconnect();
  }
}
