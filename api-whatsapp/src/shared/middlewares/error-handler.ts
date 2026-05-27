import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/index.js';
import { logger } from '../logger/index.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  logger.error({ err }, 'Erro não tratado');

  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
  });
}
