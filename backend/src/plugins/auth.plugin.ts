import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
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
    const headers = fromNodeHeaders(request.headers);

    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      throw new UnauthorizedError('Authentication required');
    }

    request.userSession = session;
    return session;
  });

  /**
   * Native Web API Handler for Better Auth.
   *
   * Fastify consumes the incoming request stream to parse JSON bodies.
   * Instead of using `toNodeHandler(auth)` (which tries to re-read the already consumed stream),
   * we construct a standard Web Request from Fastify's parsed body and pass it to `auth.handler(req)`.
   * This also allows @fastify/cors to handle CORS and preflight requests naturally.
   */
  const handleAuthRoute = async (request: FastifyRequest, reply: FastifyReply) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost:5000'}`);
    const headers = fromNodeHeaders(request.headers);

    const hasBody = request.body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);

    const req = new Request(url.toString(), {
      method: request.method,
      headers,
      body: hasBody ? JSON.stringify(request.body) : undefined,
    });

    const response = await auth.handler(req);

    reply.status(response.status);

    const setCookies = response.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      reply.header('set-cookie', setCookies);
    }

    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie') {
        reply.header(key, value);
      }
    });

    return reply.send(response.body ? await response.text() : null);
  };

  fastify.all('/api/auth/*', handleAuthRoute);
  fastify.all('/api/auth', handleAuthRoute);
};

export default fp(authPlugin, {
  name: 'auth-plugin',
});
