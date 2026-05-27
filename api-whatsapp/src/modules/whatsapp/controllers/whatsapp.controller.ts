import type { Request, Response, NextFunction } from 'express';
import { whatsappManager } from '../services/index.js';
import { toStatusResponse } from '../utils/status-response.util.js';

export class WhatsAppController {
  async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await toStatusResponse(whatsappManager.getStatus());
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async connect(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await toStatusResponse(await whatsappManager.connect());
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await whatsappManager.logout();
      res.json({
        success: true,
        message: 'Sessão encerrada e autenticação local removida',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const whatsappController = new WhatsAppController();