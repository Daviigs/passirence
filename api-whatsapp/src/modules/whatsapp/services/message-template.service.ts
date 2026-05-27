import type { AppointmentMessagePayload } from '../types/index.js';

export function buildAppointmentConfirmationMessage(
  payload: AppointmentMessagePayload,
): string {
  return (
    `Olá, ${payload.clientName}! ✅\n\n` +
    `Seu agendamento foi confirmado:\n` +
    `• Serviço: ${payload.service}\n` +
    `• Data: ${payload.date}\n` +
    `• Horário: ${payload.time}\n\n` +
    `Qualquer dúvida, estamos à disposição.`
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
