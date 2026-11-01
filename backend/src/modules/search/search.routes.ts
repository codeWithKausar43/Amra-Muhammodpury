import { FastifyPluginAsync } from 'fastify';
import { SearchService } from './search.service.js';
import { successResponse } from '../../utils/api-response.js';

export const searchRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new SearchService(fastify.prisma);

  fastify.get('/search', async (request, reply) => {
    const { q = '', type = 'ALL', limit = '20' } = request.query as {
      q?: string;
      type?: string;
      limit?: string;
    };
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    const results = await service.search(q, type, parsedLimit);
    return reply.send(successResponse(results, 'Search results'));
  });
};
