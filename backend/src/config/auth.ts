import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './database.js';
import { env } from './env.js';
import { emailService } from '../services/email.service.js';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  user: {
    additionalFields: {
      phone: {
        type: 'string',
        required: false,
        input: true,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true if email verification is strictly blocking
    sendResetPassword: async ({ user, url }) => {
      // Re-route URL to frontend reset password page with token
      const parsedUrl = new URL(url);
      const token = parsedUrl.searchParams.get('token') || '';
      const frontendResetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
      await emailService.sendResetPasswordEmail(user.email, frontendResetUrl);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Re-route URL to frontend verify-email page with token
      const parsedUrl = new URL(url);
      const token = parsedUrl.searchParams.get('token') || '';
      const frontendVerifyUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
      await emailService.sendVerificationEmail(user.email, frontendVerifyUrl, user.name);
    },
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/google`,
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === 'production',
  },
});

export type AuthSession = typeof auth.$Infer.Session;
