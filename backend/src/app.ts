import fastify, { FastifyInstance } from 'fastify';
import { getLoggerConfig } from './config/logger.js';
import prismaPlugin from './plugins/prisma.plugin.js';
import corsPlugin from './plugins/cors.plugin.js';
import securityPlugin from './plugins/security.plugin.js';
import swaggerPlugin from './plugins/swagger.plugin.js';
import authPlugin from './plugins/auth.plugin.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { cloudinaryRoutes } from './integrations/cloudinary/cloudinary.routes.js';
import { feedRoutes } from './modules/feed/feed.routes.js';
import { errorResponse } from './utils/api-response.js';
import { HTTP_STATUS } from './constants/status-codes.js';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    logger: getLoggerConfig(),
    trustProxy: true,
  });

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Global not found handler for unmatched routes
  app.setNotFoundHandler((request, reply) => {
    reply
      .status(HTTP_STATUS.NOT_FOUND)
      .send(errorResponse(`Route ${request.method}:${request.url} not found`, 'NOT_FOUND'));
  });

  // Core infrastructure plugins
  await app.register(securityPlugin);
  await app.register(corsPlugin);
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);

  // Better Auth core plugin (serves /api/auth/*)
  await app.register(authPlugin);

  // API v1 versioned business & integration routes
  await app.register(
    async (v1) => {
      await v1.register(healthRoutes);
      await v1.register(authRoutes);
      await v1.register(cloudinaryRoutes);
      await v1.register(feedRoutes);
    },
    { prefix: '/api/v1' },
  );

  return app;
};
