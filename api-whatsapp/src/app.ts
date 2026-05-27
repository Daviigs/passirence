import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/index.js';
import { whatsappModuleRoutes } from './modules/whatsapp/routes/index.js';
import { apiKeyMiddleware, errorHandler } from './shared/middlewares/index.js';
import { logger } from './shared/logger/index.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      methods: ['GET', 'POST'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.isProduction,
    }),
  );
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Muitas requisições. Tente novamente em breve.',
      },
    }),
  );

  app.use(apiKeyMiddleware);
  app.use(whatsappModuleRoutes);

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Rota não encontrada' });
  });

  app.use(errorHandler);

  return app;
}
