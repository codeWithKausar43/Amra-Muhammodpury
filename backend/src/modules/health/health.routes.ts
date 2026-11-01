import { FastifyPluginAsync } from 'fastify';
import { HealthController } from './health.controller.js';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Get service liveness status and performance metrics',
        tags: ['System'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  service: { type: 'string' },
                  timestamp: { type: 'string' },
                  uptimeSeconds: { type: 'number' },
                  memoryUsageMb: {
                    type: 'object',
                    properties: {
                      rss: { type: 'number' },
                      heapTotal: { type: 'number' },
                      heapUsed: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    HealthController.getHealth,
  );

  fastify.get(
    '/health/ready',
    {
      schema: {
        description: 'Verify database connectivity and application readiness',
        tags: ['System'],
      },
    },
    HealthController.getReadiness,
  );
};
