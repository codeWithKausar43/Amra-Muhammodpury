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
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  logger: {
    level: 'debug',
  },
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
    minPasswordLength: 6,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      try {
        const parsedUrl = new URL(url);
        const token = parsedUrl.searchParams.get('token') || '';
        const frontendResetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
        await emailService.sendResetPasswordEmail(user.email, frontendResetUrl);
      } catch (err) {
        console.error('[Auth] sendResetPassword error:', err);
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        // url may be an absolute URL from Better Auth — extract the token
        let frontendVerifyUrl: string;
        try {
          const parsedUrl = new URL(url);
          const token = parsedUrl.searchParams.get('token') || '';
          frontendVerifyUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
        } catch {
          // url was not a valid absolute URL, use it as-is fallback
          frontendVerifyUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(url)}`;
        }
        await emailService.sendVerificationEmail(user.email, frontendVerifyUrl, user.name);
      } catch (err) {
        // Log but do NOT re-throw — a missing email must not block registration
        console.error('[Auth] sendVerificationEmail error:', err);
      }
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
