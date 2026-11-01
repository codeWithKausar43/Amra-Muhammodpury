import { FastifyPluginAsync } from 'fastify';
import { AuthController } from './auth.controller.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/auth/register',
    {
      schema: {
        description: 'Register a new user account',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 50 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    AuthController.register,
  );

  fastify.post(
    '/auth/login',
    {
      schema: {
        description: 'Authenticate user with email and password',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    AuthController.login,
  );
};
