import {z} from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_SSL: z.coerce.boolean().default(false),
});

export type EnvConfig = z.infer<typeof envSchema>;
