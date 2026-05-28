import type {
  AppointmentCancelPayload,
  AppointmentConfirmationPayload,
  AppointmentReminderPayload,
  SendMessagePayload,
} from '../types/index.js';
import {
  buildAppointmentCancelMessage,
  buildAppointmentConfirmationMessage,
  buildAppointmentReminderMessage,
} from './message-template.service.js';
import { whatsappManager } from './whatsapp-manager.service.js';

export class MessagesService {
  async sendGeneric(payload: SendMessagePayload) {
    return whatsappManager.sendTextMessage(payload.phone, payload.message);
  }

  async sendAppointmentConfirmation(payload: AppointmentConfirmationPayload) {
    const message = buildAppointmentConfirmationMessage(payload);
    return whatsappManager.sendTextMessage(payload.phone, message);
  }

  async sendAppointmentCancel(payload: AppointmentCancelPayload) {
    const message = buildAppointmentCancelMessage(payload);
    return whatsappManager.sendTextMessage(payload.phone, message);
  }

  async sendAppointmentReminder(payload: AppointmentReminderPayload) {
    const message = buildAppointmentReminderMessage(payload);
    return whatsappManager.sendTextMessage(payload.phone, message);
  }
}

export const messagesService = new MessagesService();
