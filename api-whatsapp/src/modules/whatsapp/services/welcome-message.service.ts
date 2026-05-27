import { env } from '../../../config/index.js';
import { logger } from '../../../shared/logger/index.js';

/**
 * Controle em memória: envia boas-vindas apenas na primeira mensagem
 * e ignora novas por 6h (configurável) a partir do timestamp salvo.
 */
class WelcomeMessageService {
  private readonly cooldownByPhone = new Map<string, number>();

  shouldSendWelcome(phone: string): boolean {
    const now = Date.now();
    const lastSentAt = this.cooldownByPhone.get(phone);

    if (lastSentAt === undefined) {
      return true;
    }

    const elapsed = now - lastSentAt;
    return elapsed >= env.welcomeCooldownMs;
  }

  markWelcomeSent(phone: string): void {
    this.cooldownByPhone.set(phone, Date.now());
    logger.debug({ phone }, 'Cooldown de boas-vindas registrado');
  }

  getMessage(): string {
    return env.WELCOME_MESSAGE;
  }

  clear(): void {
    this.cooldownByPhone.clear();
  }
}

export const welcomeMessageService = new WelcomeMessageService();
