import type {
  AppointmentCancelPayload,
  AppointmentConfirmationPayload,
  AppointmentReminderPayload,
} from '../types/index.js';
import { formatCurrencyBRL } from '../utils/currency.util.js';

export function buildAppointmentConfirmationMessage(
  payload: AppointmentConfirmationPayload,
): string {
  const totalFormatted = formatCurrencyBRL(payload.totalPrice);

  return (
    `*Agendamento Confirmado!* ✅\n\n` +
    `Olá, ${payload.clientName}! 👊\n\n` +
    `Estamos passando para confirmar os detalhes do seu agendamento:\n\n` +
    `📅 *Data:* ${payload.date}\n` +
    `⏰ *Horário:* ${payload.time}\n` +
    `✂️ *Serviço:* ${payload.service}\n\n` +
    `💰 *Valor Total:* ${totalFormatted}\n\n` +
    `⚠️ Caso não compareça sem aviso prévio, será cobrada uma taxa de 50% do valor do serviço.\n\n` +
    `Aguardamos você! 🤝`
  );
}

export function buildAppointmentCancelMessage(payload: AppointmentCancelPayload): string {
  return (
    `*Agendamento Cancelado!* ❌\n\n` +
    `Olá, ${payload.clientName}! 👊\n\n` +
    `Seu agendamento foi cancelado com sucesso.\n\n` +
    `📅 *Data:* ${payload.date}\n` +
    `⏰ *Horário:* ${payload.time}\n` +
    `✂️ *Serviço:* ${payload.service}\n\n` +
    `Caso queira, você poderá realizar um novo agendamento diretamente pelo sistema. 🤝`
  );
}

export function buildAppointmentReminderMessage(payload: AppointmentReminderPayload): string {
  return (
    `Olá, ${payload.clientName}! ⏰\n\n` +
    `Lembrete do seu agendamento:\n` +
    `• Serviço: ${payload.service}\n` +
    `• Data: ${payload.date}\n` +
    `• Horário: ${payload.time}\n\n` +
    `Aguardamos você!`
  );
}
