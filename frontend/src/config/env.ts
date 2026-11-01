import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('আমরা মুহাম্মদপুরী'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:5000/api/v1'),
});

const parseClientEnv = () => {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  });

  if (!parsed.success) {
    console.error('❌ Invalid Frontend Environment Variables:', parsed.error.format());
    throw new Error('Invalid frontend environment variables');
  }

  return parsed.data;
};

export const env = parseClientEnv();
