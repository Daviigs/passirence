import pino from 'pino';
import { env } from '../../config/index.js';

export const logger = pino({
  level: env.isProduction ? 'info' : 'debug',
});
