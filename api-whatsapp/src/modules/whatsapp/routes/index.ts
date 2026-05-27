import { Router } from 'express';
import { healthRoutes } from './health.routes.js';
import { messagesRoutes } from './messages.routes.js';
import { whatsappRoutes } from './whatsapp.routes.js';

export const whatsappModuleRoutes = Router();

whatsappModuleRoutes.use(healthRoutes);
whatsappModuleRoutes.use('/whatsapp', whatsappRoutes);
whatsappModuleRoutes.use('/messages', messagesRoutes);
