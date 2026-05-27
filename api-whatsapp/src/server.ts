import { createApp } from './app.js';
import { env } from './config/index.js';
import { logger } from './shared/logger/index.js';

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info({ port: env.PORT, host: env.HOST }, 'API WhatsApp iniciada');
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Encerrando API...');
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
});
