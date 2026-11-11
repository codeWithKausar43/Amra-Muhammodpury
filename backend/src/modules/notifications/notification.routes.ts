import { FastifyPluginAsync } from 'fastify';
import { NotificationService } from './notification.service.js';
import { successResponse } from '../../utils/api-response.js';

export const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new NotificationService(fastify.prisma);

  // Get VAPID public key for browser push subscription
  fastify.get('/notifications/vapid-public-key', async () => {
    return successResponse({ publicKey: service.getVapidPublicKey() });
  });

  // Save Web Push subscription for authenticated user
  fastify.post('/notifications/push-subscribe', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const body = request.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    const result = await service.subscribePush(session.user.id, body);
    return reply.send(successResponse(result, 'পুশ নোটিফিকেশন সফলভাবে নিবন্ধিত হয়েছে'));
  });

  // Send a test push notification to user's phone with sweet sound & vibration
  fastify.post('/notifications/test-push', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const result = await service.sendPushToUser(session.user.id, {
      title: 'মোহাম্মদপুর কমিউনিটি 🔔',
      body: '🎵 মিষ্টি নোটিফিকেশন সাউন্ড ও পুশ অ্যালার্ট সফলভাবে কাজ করছে!',
      url: '/organization/member',
      sound: '/sounds/notification.wav',
      tag: 'test-sound-push',
    });
    return reply.send(
      successResponse(result, 'টেস্ট নোটিফিকেশন সফলভাবে আপনার ডিভাইসে পাঠানো হয়েছে!'),
    );
  });

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
