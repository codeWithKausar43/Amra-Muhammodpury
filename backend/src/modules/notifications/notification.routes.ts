import { FastifyPluginAsync } from 'fastify';
import { NotificationService } from './notification.service.js';
import { successResponse } from '../../utils/api-response.js';

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new NotificationService(fastify.prisma);

  fastify.get('/notifications', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const result = await service.getNotifications(session.user.id);
    return reply.send(successResponse(result, 'Notifications retrieved'));
  });

  fastify.patch('/notifications/:id/read', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { id } = request.params as { id: string };
    const result = await service.markAsRead(id, session.user.id);
    return reply.send(successResponse(result, 'Notification marked as read'));
  });

  fastify.post('/notifications/read-all', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const result = await service.markAllAsRead(session.user.id);
    return reply.send(successResponse(result, result.message));
  });
};
