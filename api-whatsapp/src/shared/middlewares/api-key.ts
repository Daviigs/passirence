import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/index.js';
import { AppError } from '../errors/index.js';

export function apiKeyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!env.API_KEY) {
    next();
    return;
  }

  const apiKey = req.header('x-api-key');

  if (!apiKey || apiKey !== env.API_KEY) {
    next(new AppError('Não autorizado', 401, 'UNAUTHORIZED'));
    return;
  }

  next();
}
