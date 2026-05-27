import type { Request, Response } from 'express';
import { whatsappManager } from '../services/index.js';

export class HealthController {
  get(_req: Request, res: Response): void {
    const status = whatsappManager.getStatus();

    res.json({
      success: true,
      data: {
        api: 'ok',
        whatsapp: status.status,
        phoneNumber: status.phoneNumber,
      },
    });
  }
}

export const healthController = new HealthController();
