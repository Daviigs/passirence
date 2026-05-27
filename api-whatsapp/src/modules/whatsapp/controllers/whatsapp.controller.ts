import type { Request, Response, NextFunction } from 'express';
import { whatsappManager } from '../services/index.js';

export class WhatsAppController {
  getStatus(_req: Request, res: Response): void {
    res.json({
      success: true,
      data: whatsappManager.getStatus(),
    });
  }

  async connect(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await whatsappManager.connect();
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
