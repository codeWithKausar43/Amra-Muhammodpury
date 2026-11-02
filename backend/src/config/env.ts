import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/amra_muhammadpuri_dev?schema=public'),

  // Better Auth
  BETTER_AUTH_SECRET: z
    .string()
    .min(16)
    .default('amra-muhammadpuri-secret-key-min-32-chars-long-prod'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:5000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Google OAuth (Optional in dev, required in prod if enabled)
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),

  // SMTP Email Configuration (Optional in dev, logs to console if empty)
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASSWORD: z.string().optional().default(''),
  SMTP_FROM: z.string().default('আমরা মোহাম্মদপুরী <no-reply@amra-muhammadpuri.org>'),

  // Cloudinary Media Configuration
  CLOUDINARY_CLOUD_NAME: z.string().default('rim6yblt'),
  CLOUDINARY_API_KEY: z.string().default('545392829589828'),
  CLOUDINARY_API_SECRET: z.string().default('5uvhfY2q3_kELnn6jQL8QFvW9WI'),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('amra-muhammadpuri'),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      '❌ Invalid backend environment variables:\n',
      JSON.stringify(parsed.error.format(), null, 2),
    );
    throw new Error('Invalid backend environment configuration');
  }

  return parsed.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
