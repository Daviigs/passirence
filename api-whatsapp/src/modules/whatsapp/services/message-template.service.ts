import type { AppointmentMessagePayload } from '../types/index.js';
import { formatCurrencyBRL } from '../utils/currency.util.js';

export function buildAppointmentConfirmationMessage(
  payload: AppointmentMessagePayload,
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

export function buildAppointmentCancelMessage(payload: AppointmentMessagePayload): string {
  return (
    `Olá, ${payload.clientName}.\n\n` +
    `Seu agendamento foi cancelado:\n` +
    `• Serviço: ${payload.service}\n` +
    `• Data: ${payload.date}\n` +
    `• Horário: ${payload.time}\n\n` +
    `Para reagendar, entre em contato conosco.`
  );
}

export function buildAppointmentReminderMessage(payload: AppointmentMessagePayload): string {
  return (
    `Olá, ${payload.clientName}! ⏰\n\n` +
    `Lembrete do seu agendamento:\n` +
    `• Serviço: ${payload.service}\n` +
    `• Data: ${payload.date}\n` +
    `• Horário: ${payload.time}\n\n` +
    `Aguardamos você!`
  );
}
