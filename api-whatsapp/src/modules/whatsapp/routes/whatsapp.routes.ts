import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller.js';

export const whatsappRoutes = Router();

whatsappRoutes.get('/status', (req, res, next) =>
  whatsappController.getStatus(req, res, next),
);
whatsappRoutes.post('/connect', (req, res, next) =>
  whatsappController.connect(req, res, next),
);
whatsappRoutes.post('/logout', (req, res, next) =>
  whatsappController.logout(req, res, next),
);
