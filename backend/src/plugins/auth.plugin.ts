import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../config/auth.js';
import { UnauthorizedError } from '../errors/app-error.js';

declare module 'fastify' {
  interface FastifyInstance {
    auth: typeof auth;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<typeof auth.$Infer.Session>;
  }
  interface FastifyRequest {
    userSession?: typeof auth.$Infer.Session;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('auth', auth);

  // Authentication hook for protected endpoints
  fastify.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      throw new UnauthorizedError('Authentication required');
    }

    request.userSession = session;
    return session;
  });

  const betterAuthHandler = toNodeHandler(auth);

  // Handle all Better Auth routes under /api/auth
  fastify.all('/api/auth/*', async (request, reply) => {
    reply.hijack();
    betterAuthHandler(request.raw, reply.raw);
  });

  fastify.all('/api/auth', async (request, reply) => {
    reply.hijack();
    betterAuthHandler(request.raw, reply.raw);
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
});
