import {z} from 'zod';

const booleanFromEnv = z.preprocess(value => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off', ''].includes(normalized)) {
    return false;
  }

  return value;
}, z.boolean());

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_SSL: booleanFromEnv.default(false),
  ADMIN_AUTH_SECRET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

