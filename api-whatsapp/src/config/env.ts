import path from 'node:path';
import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  API_KEY: z.string().optional(),
  AUTH_STATE_PATH: z.string().default('storage/auth'),
  WELCOME_MESSAGE: z
    .string()
    .default('Olá! 👋 Obrigado por entrar em contato. Em breve retornaremos.'),
  WELCOME_COOLDOWN_HOURS: z.coerce.number().positive().default(6),
  RECONNECT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  RECONNECT_DELAY_MS: z.coerce.number().int().positive().default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  isProduction: data.NODE_ENV === 'production',
  authStatePath: path.resolve(process.cwd(), data.AUTH_STATE_PATH),
  welcomeCooldownMs: data.WELCOME_COOLDOWN_HOURS * 60 * 60 * 1000,
  corsOrigins:
    data.CORS_ORIGIN === '*'
      ? '*'
      : data.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
};
