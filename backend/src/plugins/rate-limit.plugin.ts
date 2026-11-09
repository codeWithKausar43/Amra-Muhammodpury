import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/api-response.js';
import { HTTP_STATUS } from '../constants/status-codes.js';

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // Relax rate limiting in test environment
  const isTest = env.NODE_ENV === 'test';

  await fastify.register(rateLimit, {
    max: isTest ? 10000 : 120, // 120 requests per minute in production
    timeWindow: '1 minute',
    allowList: (req) => {
      const url = req.url;
      // Exempt health-check probes and websocket connections from rate limiting
      return (
        url === '/' ||
        url === '/health' ||
        url.startsWith('/api/v1/health') ||
        url.startsWith('/docs') ||
        url.includes('/realtime/ws')
      );
    },
    errorResponseBuilder: (_req, context) => {
      return {
        ...errorResponse(
          `অতিরিক্ত রিকোয়েস্ট এসেছে। অনুগ্রহ করে ${Math.ceil(context.ttl / 1000)} সেকেন্ড পর পুনরায় চেষ্টা করুন। (Rate limit exceeded)`,
          'RATE_LIMIT_EXCEEDED',
        ),
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      };
    },
  });
};

export default fp(rateLimitPlugin, {
  name: 'rate-limit-plugin',
});

