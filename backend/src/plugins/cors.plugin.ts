import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env.js';

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  const configuredOrigins = env.FRONTEND_URL
    ? env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean)
    : [];

  const allowedOrigins = Array.from(
    new Set([
      ...configuredOrigins,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]),
  );

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return cb(null, true);

      // Check explicit allowed origins or wildcard
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return cb(null, true);
      }

      // Allow Vercel preview deployment origins (e.g. https://amra-muhammodpury-*.vercel.app)
      if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) {
        return cb(null, true);
      }

      // Gracefully reject unauthorized origins without throwing 500 error
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
};

export default fp(corsPlugin, {
  name: 'cors-plugin',
});
