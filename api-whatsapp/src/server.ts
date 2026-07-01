import { createApp } from './app.js';
import { env } from './config/index.js';
import { whatsappManager } from './modules/whatsapp/services/index.js';
import { logger } from './shared/logger/index.js';

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(
    { port: env.PORT, host: env.HOST, pid: process.pid, authStatePath: env.authStatePath },
    'API WhatsApp iniciada',
  );
});

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal, pid: process.pid, authStatePath: env.authStatePath }, 'Encerrando API...');

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  }).catch((error) => {
    logger.warn({ error, pid: process.pid }, 'Erro ao fechar servidor HTTP');
  });

  await whatsappManager.shutdown();
  process.exit(0);
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
});
