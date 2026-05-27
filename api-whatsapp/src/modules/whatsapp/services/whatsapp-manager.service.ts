import makeWASocket, {
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  type WASocket,
} from '@whiskeysockets/baileys';
import { env } from '../../../config/index.js';
import { AppError } from '../../../shared/errors/index.js';
import { logger } from '../../../shared/logger/index.js';
import { handleConnectionUpdate, handleIncomingMessages } from '../handlers/index.js';
import { clearAuthState, loadAuthState } from '../sessions/auth-state.session.js';
import type { ConnectionStatus, WhatsAppStatus } from '../types/index.js';
import { resolvePhoneToJid } from '../utils/index.js';

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
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly reconnectAttempts = { current: 0 };
  private saveCreds: (() => Promise<void>) | null = null;

  getStatus(): WhatsAppStatus {
    return {
      status: this.connectionStatus,
      connected: this.connectionStatus === 'connected',
      phoneNumber: this.phoneNumber,
      profileName: this.profileName,
      qrCode: this.qrCode,
    };
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.socket !== null;
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
      await clearAuthState();

      this.connectionStatus = 'disconnected';
      this.qrCode = null;
      this.phoneNumber = null;
      this.profileName = null;
      this.reconnectAttempts.current = 0;

      logger.info('Logout realizado e autenticação local limpa');
    } finally {
      this.isLoggingOut = false;
    }
  }

  async sendTextMessage(phone: string, message: string): Promise<{ jid: string }> {
    if (!this.isConnected() || !this.socket) {
      throw new AppError('WhatsApp não está conectado', 503, 'WHATSAPP_DISCONNECTED');
    }

    const trimmed = message.trim();
    if (!trimmed) {
      throw new AppError('Mensagem não pode ser vazia', 400, 'EMPTY_MESSAGE');
    }

    let jid: string;
    try {
      jid = await resolvePhoneToJid(this.socket, phone);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Telefone inválido';
      throw new AppError(messageText, 400, 'INVALID_PHONE');
    }

    try {
      await this.socket.sendMessage(jid, { text: trimmed });
      logger.info({ jid }, 'Mensagem enviada');
      return { jid };
    } catch (error) {
      logger.error({ error, jid }, 'Falha ao enviar mensagem');
      throw new AppError('Falha ao enviar mensagem', 502, 'SEND_FAILED');
    }
  }

  private async startSocket(): Promise<void> {
    if (this.socket) {
      return;
    }

    const { state, saveCreds } = await loadAuthState();
    this.saveCreds = saveCreds;

    const { version } = await fetchLatestBaileysVersion();
    const baileysLogger = logger.child({ module: 'baileys' });

    this.connectionStatus = 'connecting';
    this.qrCode = null;

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
    });

    this.socket = socket;
    this.registerEventHandlers(socket);
  }

  private registerEventHandlers(socket: WASocket): void {
    socket.ev.on('creds.update', async () => {
      try {
        await this.saveCreds?.();
      } catch (error) {
        logger.error({ error }, 'Falha ao salvar credenciais');
      }
    });

    socket.ev.on('connection.update', (update) => {
      handleConnectionUpdate(
        update,
        {
          onQr: (qr) => {
            this.qrCode = qr;
            this.connectionStatus = 'qr_pending';
          },
          onConnected: () => {
            this.connectionStatus = 'connected';
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
            this.scheduleReconnect();
          },
          onLoggedOut: () => {
            this.connectionStatus = 'disconnected';
            this.qrCode = null;
            this.phoneNumber = null;
            this.profileName = null;
            void clearAuthState().catch((error) => {
              logger.error({ error }, 'Falha ao limpar auth após logout remoto');
            });
            void this.destroySocket();
          },
        },
        this.reconnectAttempts,
        env.RECONNECT_MAX_ATTEMPTS,
      );
    });

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      if (!this.socket || this.connectionStatus !== 'connected') return;

      try {
        await handleIncomingMessages(this.socket, messages);
      } catch (error) {
        logger.error({ error }, 'Erro no handler de mensagens');
      }
    });
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

  private scheduleReconnect(): void {
    this.clearReconnectTimeout();
    void this.destroySocket();

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.isLoggingOut) return;

      logger.info('Iniciando reconexão automática');
      void this.connect().catch((error) => {
        logger.error({ error }, 'Falha na reconexão automática');
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
    this.clearReconnectTimeout();

    if (!this.socket) return;

    try {
      this.socket.ev.removeAllListeners('connection.update');
      this.socket.ev.removeAllListeners('creds.update');
      this.socket.ev.removeAllListeners('messages.upsert');
      this.socket.end(undefined);
    } catch (error) {
      logger.warn({ error }, 'Erro ao encerrar socket');
    }

    this.socket = null;
    this.saveCreds = null;
  }
}

export const whatsappManager = new WhatsAppManagerService();
