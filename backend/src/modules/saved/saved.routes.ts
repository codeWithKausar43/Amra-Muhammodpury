import { FastifyPluginAsync } from 'fastify';
import { SavedPostService } from './saved.service.js';
import { successResponse } from '../../utils/api-response.js';

export const savedRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new SavedPostService(fastify.prisma);

  fastify.get('/saved', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const saved = await service.getSavedPosts(session.user.id);
    return reply.send(successResponse(saved, 'Saved posts retrieved'));
  });

  fastify.post('/saved/:postId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { postId } = request.params as { postId: string };
    const result = await service.toggleSave(session.user.id, postId);
    return reply.send(successResponse(result, result.message));
  });
};
