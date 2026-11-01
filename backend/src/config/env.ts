import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@localhost:5432/amra_muhammadpuri_dev?schema=public'),
  JWT_SECRET: z.string().min(16).default('development-jwt-secret-minimum-16-chars'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      '❌ Invalid environment variables:\n',
      JSON.stringify(parsed.error.format(), null, 2),
    );
    throw new Error('Invalid environment configuration');
  }

  return parsed.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
