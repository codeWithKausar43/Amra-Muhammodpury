import { FastifyPluginAsync } from 'fastify';
import { AuthController } from './auth.controller.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/auth/check',
    {
      schema: {
        description: 'Verify if email or Bangladesh mobile number is available',
        tags: ['Auth'],
        querystring: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
          },
        },
      },
    },
    AuthController.checkAvailability,
  );

  fastify.get(
    '/auth/me',
    {
      schema: {
        description: 'Get profile details of the currently authenticated Better Auth session',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
      },
    },
    AuthController.getCurrentUser,
  );
};
