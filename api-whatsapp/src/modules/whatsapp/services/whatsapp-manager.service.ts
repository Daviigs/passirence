import makeWASocket, {
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from '@whiskeysockets/baileys';
import { env } from '../../../config/index.js';
import { AppError } from '../../../shared/errors/index.js';
import { logger } from '../../../shared/logger/index.js';
import { handleConnectionUpdate, handleIncomingMessages } from '../handlers/index.js';
import { AuthInstanceLockError, acquireAuthInstanceLock } from '../sessions/auth-instance-lock.js';
import { clearAuthState, loadAuthState } from '../sessions/auth-state.session.js';
import { sentMessageStore } from '../sessions/sent-message.store.js';
import type { ConnectionStatus, WhatsAppStatus } from '../types/index.js';
import { resolvePhoneToJid } from '../utils/index.js';

const CREDS_SAVE_MAX_RETRIES = 3;
const CREDS_SAVE_RETRY_DELAY_MS = 500;
const SHUTDOWN_FLUSH_DELAY_MS = 500;

/**
 * Singleton: única instância do socket WhatsApp na aplicação.
 */
class WhatsAppManagerService {
  private socket: WASocket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private qrCode: string | null = null;
  private phoneNumber: string | null = null;
  private profileName: string | null = null;
  private isConnecting = false;
  private isLoggingOut = false;
  private sessionDegraded = false;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly reconnectAttempts = { current: 0 };
  private saveCreds: (() => Promise<void>) | null = null;
  private releaseAuthLock: (() => Promise<void>) | null = null;
  private sendChain: Promise<unknown> = Promise.resolve();
  private credsSaveChain: Promise<void> = Promise.resolve();
  private socketInstanceId = 0;
  private activeSocketInstanceId = 0;
  private pendingNotificationsReceived = false;

  getStatus(): WhatsAppStatus {
    return {
      status: this.connectionStatus,
      connected: this.isConnected(),
      phoneNumber: this.phoneNumber,
      profileName: this.profileName,
      qrCode: this.qrCode,
    };
  }

  isConnected(): boolean {
    return (
      this.connectionStatus === 'connected' &&
      this.socket !== null &&
      !this.sessionDegraded
    );
  }

  async connect(): Promise<WhatsAppStatus> {
    if (this.isConnected()) {
      return this.getStatus();
    }

    if (this.isConnecting) {
      return this.getStatus();
    }

    this.isConnecting = true;

    try {
      await this.startSocket();
      return this.getStatus();
    } finally {
      this.isConnecting = false;
    }
  }

  async logout(): Promise<void> {
    this.isLoggingOut = true;
    this.clearReconnectTimeout();

    try {
      if (this.socket) {
        try {
          await this.socket.logout();
        } catch (error) {
          logger.warn({ error }, 'Erro ao fazer logout no socket (pode já estar desconectado)');
        }
      }

      await this.destroySocket();
      sentMessageStore.clear();
      await clearAuthState();

      this.connectionStatus = 'disconnected';
      this.qrCode = null;
      this.phoneNumber = null;
      this.profileName = null;
      this.reconnectAttempts.current = 0;
      this.sessionDegraded = false;

      logger.info({ pid: process.pid }, 'Logout realizado e autenticação local limpa');
    } finally {
      this.isLoggingOut = false;
    }
  }

  async shutdown(): Promise<void> {
    logger.info({ pid: process.pid, authStatePath: env.authStatePath }, 'Encerrando WhatsApp manager');
    this.clearReconnectTimeout();
    await this.destroySocket();
    await new Promise((resolve) => setTimeout(resolve, SHUTDOWN_FLUSH_DELAY_MS));
    logger.info({ pid: process.pid }, 'WhatsApp manager encerrado');
  }

  async sendTextMessage(phone: string, message: string): Promise<{ jid: string }> {
    return this.runExclusiveSend(async () => {
      const socket = this.socket;
      if (!socket || this.connectionStatus !== 'connected' || this.sessionDegraded) {
        throw new AppError('WhatsApp não está conectado', 503, 'WHATSAPP_DISCONNECTED');
      }

      const trimmed = message.trim();
      if (!trimmed) {
        throw new AppError('Mensagem não pode ser vazia', 400, 'EMPTY_MESSAGE');
      }

      let jid: string;
      try {
        jid = await resolvePhoneToJid(socket, phone);
        logger.info({ phone, jid, pid: process.pid }, 'JID resolvido para envio');
      } catch (error) {
        const messageText = error instanceof Error ? error.message : 'Telefone inválido';
        throw new AppError(messageText, 400, 'INVALID_PHONE');
      }

      if (this.socket !== socket || this.connectionStatus !== 'connected' || this.sessionDegraded) {
        throw new AppError('WhatsApp desconectou durante o envio', 503, 'WHATSAPP_DISCONNECTED');
      }

      try {
        const sent = await socket.sendMessage(jid, { text: trimmed });
        sentMessageStore.set(sent.key, sent.message);
        logger.info(
          {
            jid,
            phone,
            messageId: sent.key.id,
            remoteJid: sent.key.remoteJid,
            connectionStatus: this.connectionStatus,
            socketInstanceId: this.activeSocketInstanceId,
            pendingNotificationsReceived: this.pendingNotificationsReceived,
            pid: process.pid,
          },
          'Mensagem enviada',
        );
        return { jid };
      } catch (error) {
        logger.error({ error, jid, phone, pid: process.pid }, 'Falha ao enviar mensagem');
        throw new AppError('Falha ao enviar mensagem', 502, 'SEND_FAILED');
      }
    });
  }

  private async startSocket(): Promise<void> {
    if (this.socket) {
      logger.warn({ pid: process.pid }, 'startSocket ignorado: socket já existe');
      return;
    }

    try {
      const lock = await acquireAuthInstanceLock();
      this.releaseAuthLock = lock.release;
    } catch (error) {
      if (error instanceof AuthInstanceLockError) {
        logger.error(
          { pid: process.pid, authStatePath: env.authStatePath, error: error.message },
          'Instância duplicada detectada — socket não será iniciado',
        );
        this.connectionStatus = 'disconnected';
        return;
      }
      throw error;
    }

    logger.info({ pid: process.pid, authStatePath: env.authStatePath }, 'Criando socket WhatsApp');

    const { state, saveCreds } = await loadAuthState();
    this.saveCreds = saveCreds;
    this.sessionDegraded = false;

    const { version } = await fetchLatestBaileysVersion();
    const baileysLogger = logger.child({ module: 'baileys' });

    this.connectionStatus = 'connecting';
    this.qrCode = null;
    this.pendingNotificationsReceived = false;

    const instanceId = ++this.socketInstanceId;
    this.activeSocketInstanceId = instanceId;

    const socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
      },
      printQRInTerminal: false,
      logger: baileysLogger,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      getMessage: async (key) => {
        const message = sentMessageStore.get(key);
        logger.info(
          {
            messageId: key.id,
            remoteJid: key.remoteJid,
            fromMe: key.fromMe,
            found: message !== undefined,
            socketInstanceId: instanceId,
            connectionStatus: this.connectionStatus,
            pid: process.pid,
          },
          'getMessage solicitado (retry multi-dispositivo)',
        );
        return message;
      },
    });

    this.socket = socket;
    this.registerEventHandlers(socket, instanceId);
    logger.info({ pid: process.pid, socketInstanceId: instanceId }, 'Socket WhatsApp criado');
  }

  private registerEventHandlers(socket: WASocket, socketInstanceId: number): void {
    socket.ev.on('creds.update', () => {
      logger.debug({ pid: process.pid, socketInstanceId }, 'creds.update recebido');
      this.credsSaveChain = this.credsSaveChain
        .then(() => this.persistCreds())
        .catch((error) => {
          logger.error({ error }, 'Erro na fila de persistência de credenciais');
        });
    });

    socket.ev.on('connection.update', (update) => {
      if (update.receivedPendingNotifications === true) {
        this.pendingNotificationsReceived = true;
        logger.info(
          { pid: process.pid, socketInstanceId, connectionStatus: this.connectionStatus },
          'Notificações pendentes recebidas — sessão pronta para sync multi-dispositivo',
        );
      }

      if (update.receivedPendingNotifications === false) {
        this.pendingNotificationsReceived = false;
      }

      logger.debug(
        {
          connection: update.connection,
          receivedPendingNotifications: update.receivedPendingNotifications,
          isOnline: update.isOnline,
          isNewLogin: update.isNewLogin,
          socketInstanceId,
          pid: process.pid,
        },
        'connection.update',
      );

      handleConnectionUpdate(
        update,
        {
          onQr: (qr) => {
            this.qrCode = qr;
            this.connectionStatus = 'qr_pending';
          },
          onConnected: () => {
            this.connectionStatus = 'connected';
            this.sessionDegraded = false;
            this.qrCode = null;
            void this.updateProfileInfo(socket);
          },
          onDisconnected: (status) => {
            if (!this.isLoggingOut) {
              this.connectionStatus = status;
            }
          },
          onReconnect: () => {
            if (this.isLoggingOut) return;
            void this.scheduleReconnect();
          },
          onLoggedOut: () => {
            void this.handleRemoteLogout();
          },
          onMaxReconnectAttempts: () => {
            void this.handleMaxReconnectAttempts();
          },
        },
        this.reconnectAttempts,
        env.RECONNECT_MAX_ATTEMPTS,
      );
    });

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      for (const message of messages) {
        if (message.key.fromMe && message.message) {
          sentMessageStore.set(message.key, message.message);
        }
      }

      if (type !== 'notify') return;
      if (!this.socket || this.connectionStatus !== 'connected') return;

      try {
        await handleIncomingMessages(this.socket, messages);
      } catch (error) {
        logger.error({ error, socketInstanceId, pid: process.pid }, 'Erro no handler de mensagens');
      }
    });

    socket.ev.on('messages.update', (updates) => {
      logger.debug(
        {
          count: updates.length,
          updates: updates.map((item) => ({
            id: item.key.id,
            remoteJid: item.key.remoteJid,
            fromMe: item.key.fromMe,
            status: item.update.status,
          })),
        },
        'messages.update',
      );
    });

    socket.ev.on('presence.update', (update) => {
      logger.debug(
        { id: update.id, presences: update.presences, pid: process.pid },
        'presence.update',
      );
    });
  }

  private async handleRemoteLogout(): Promise<void> {
    logger.warn({ pid: process.pid, authStatePath: env.authStatePath }, 'Logout remoto detectado');
    this.connectionStatus = 'disconnected';
    this.qrCode = null;
    this.phoneNumber = null;
    this.profileName = null;
    this.reconnectAttempts.current = 0;
    this.sessionDegraded = false;

    await this.destroySocket();
    sentMessageStore.clear();
    try {
      await clearAuthState();
    } catch (error) {
      logger.error({ error }, 'Falha ao limpar auth após logout remoto');
    }
  }

  private async handleMaxReconnectAttempts(): Promise<void> {
    logger.error(
      { attempts: this.reconnectAttempts.current, pid: process.pid },
      'Limite de reconexões atingido — destruindo socket',
    );
    this.connectionStatus = 'disconnected';
    await this.destroySocket();
  }

  private async persistCreds(retry = 0): Promise<void> {
    if (!this.saveCreds) return;

    try {
      await this.saveCreds();
      this.sessionDegraded = false;
      logger.debug({ pid: process.pid, retry, socketInstanceId: this.activeSocketInstanceId }, 'saveCreds concluído');
    } catch (error) {
      logger.error({ error, retry, pid: process.pid }, 'Falha ao salvar credenciais');

      if (retry < CREDS_SAVE_MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, CREDS_SAVE_RETRY_DELAY_MS * (retry + 1)));
        return this.persistCreds(retry + 1);
      }

      this.sessionDegraded = true;
      this.connectionStatus = 'disconnected';
      logger.error(
        { pid: process.pid, authStatePath: env.authStatePath },
        'Sessão marcada como degradada após falhas em saveCreds — encerrando socket',
      );
      await this.destroySocket();
    }
  }

  private async updateProfileInfo(socket: WASocket): Promise<void> {
    try {
      const user = socket.user;
      if (user?.id) {
        this.phoneNumber = user.id.split(':')[0]?.split('@')[0] ?? null;
      }
      this.profileName = user?.name ?? null;
    } catch (error) {
      logger.warn({ error }, 'Não foi possível obter dados do perfil');
    }
  }

  private async scheduleReconnect(): Promise<void> {
    this.clearReconnectTimeout();
    logger.info({ pid: process.pid }, 'Preparando reconexão — destruindo socket anterior');
    await this.destroySocket();

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.isLoggingOut) return;

      logger.info({ pid: process.pid, attempt: this.reconnectAttempts.current }, 'Iniciando reconexão automática');
      void this.connect().catch((error) => {
        logger.error({ error, pid: process.pid }, 'Falha na reconexão automática');
      });
    }, env.RECONNECT_DELAY_MS);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private async destroySocket(): Promise<void> {
    logger.info(
      {
        pid: process.pid,
        hasSocket: this.socket !== null,
        socketInstanceId: this.activeSocketInstanceId,
        connectionStatus: this.connectionStatus,
      },
      'Iniciando destroySocket',
    );
    this.clearReconnectTimeout();

    try {
      await this.credsSaveChain;
    } catch {
      // Erros já registrados em persistCreds
    }

    if (this.socket) {
      try {
        this.socket.ev.removeAllListeners('connection.update');
        this.socket.ev.removeAllListeners('creds.update');
        this.socket.ev.removeAllListeners('messages.upsert');
        this.socket.ev.removeAllListeners('messages.update');
        this.socket.ev.removeAllListeners('presence.update');
        this.socket.end(undefined);
      } catch (error) {
        logger.warn({ error, pid: process.pid }, 'Erro ao encerrar socket');
      }

      this.socket = null;
      this.saveCreds = null;
      this.activeSocketInstanceId = 0;
      this.pendingNotificationsReceived = false;
    }

    if (this.releaseAuthLock) {
      try {
        await this.releaseAuthLock();
      } catch (error) {
        logger.warn({ error, pid: process.pid }, 'Falha ao liberar lock de instância');
      }
      this.releaseAuthLock = null;
    }

    logger.info({ pid: process.pid }, 'destroySocket concluído');
  }

  private runExclusiveSend<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.sendChain.then(operation);
    this.sendChain = run.catch(() => undefined);
    return run;
  }
}

export const whatsappManager = new WhatsAppManagerService();
