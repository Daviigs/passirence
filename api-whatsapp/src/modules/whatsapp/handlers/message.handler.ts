import type { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { logger } from '../../../shared/logger/index.js';
import { welcomeMessageService } from '../services/welcome-message.service.js';
import {
  extractPhoneFromJid,
  isPersonalChatJid,
  shouldIgnoreJid,
} from '../utils/index.js';

export async function handleIncomingMessages(
  socket: WASocket,
  messages: WAMessage[],
): Promise<void> {
  for (const message of messages) {
    try {
      await processIncomingMessage(socket, message);
    } catch (error) {
      logger.error({ error, messageId: message.key.id }, 'Erro ao processar mensagem recebida');
    }
  }
}

async function processIncomingMessage(socket: WASocket, message: WAMessage): Promise<void> {
  if (message.key.fromMe) return;

  const remoteJid = message.key.remoteJid;
  if (!remoteJid || shouldIgnoreJid(remoteJid) || !isPersonalChatJid(remoteJid)) {
    return;
  }

  const phone = extractPhoneFromJid(remoteJid);
  if (!phone) return;

  if (!welcomeMessageService.shouldSendWelcome(phone)) {
    logger.debug({ phone }, 'Boas-vindas ignoradas (cooldown ativo)');
    return;
  }

  const welcomeText = welcomeMessageService.getMessage();

  await socket.sendMessage(remoteJid, { text: welcomeText });
  welcomeMessageService.markWelcomeSent(phone);

  logger.info({ phone }, 'Mensagem de boas-vindas enviada');
}
