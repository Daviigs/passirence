import type { Request, Response, NextFunction } from 'express';
import type {
  AppointmentCancelPayload,
  AppointmentConfirmationPayload,
  AppointmentReminderPayload,
  SendMessagePayload,
} from '../types/index.js';
import { messagesService } from '../services/index.js';

export class MessagesController {
  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body as SendMessagePayload;
      const result = await messagesService.sendGeneric(payload);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async sendConfirmation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body as AppointmentConfirmationPayload;
      const result = await messagesService.sendAppointmentConfirmation(payload);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async sendCancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body as AppointmentCancelPayload;
      const result = await messagesService.sendAppointmentCancel(payload);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async sendReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body as AppointmentReminderPayload;
      const result = await messagesService.sendAppointmentReminder(payload);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const messagesController = new MessagesController();
