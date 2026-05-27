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
    logger.info('WhatsApp conectado');
  }

  if (connection === 'close') {
    const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
    const isLoggedOut = statusCode === DisconnectReason.loggedOut;

    if (isLoggedOut) {
      logger.warn('Sessão encerrada (logout)');
      callbacks.onLoggedOut();
      return;
    }

    callbacks.onDisconnected('disconnected');

    if (reconnectAttempts.current >= maxReconnectAttempts) {
      logger.error(
        { attempts: reconnectAttempts.current },
        'Limite de reconexões atingido',
      );
      return;
    }

    reconnectAttempts.current += 1;
    logger.warn(
      { attempt: reconnectAttempts.current, statusCode },
      'Conexão perdida, tentando reconectar',
    );
    callbacks.onReconnect();
  }
}
