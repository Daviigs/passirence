import { Router } from 'express';
import { validateBody } from '../../../shared/middlewares/index.js';
import { messagesController } from '../controllers/messages.controller.js';
import {
  appointmentCancelSchema,
  appointmentConfirmationSchema,
  sendMessageSchema,
} from '../validators/messages.validator.js';

export const messagesRoutes = Router();

messagesRoutes.post(
  '/send',
  validateBody(sendMessageSchema),
  (req, res, next) => messagesController.send(req, res, next),
);

messagesRoutes.post(
  '/appointment/confirmation',
  validateBody(appointmentConfirmationSchema),
  (req, res, next) => messagesController.sendConfirmation(req, res, next),
);

messagesRoutes.post(
  '/appointment/cancel',
  validateBody(appointmentCancelSchema),
  (req, res, next) => messagesController.sendCancel(req, res, next),
);

messagesRoutes.post(
  '/appointment/reminder',
  validateBody(appointmentCancelSchema),
  (req, res, next) => messagesController.sendReminder(req, res, next),
);
