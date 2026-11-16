import { FastifyPluginAsync } from 'fastify';
import { MessageService } from './message.service.js';
import { successResponse } from '../../utils/api-response.js';
import { realtimeService } from '../realtime/realtime.service.js';

export const messageRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new MessageService(fastify.prisma);

  // 1. Search users for starting new conversations
  fastify.get('/messages/users/search', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { q = '' } = request.query as { q?: string };
    const users = await service.searchUsers(session.user.id, q);
    return reply.send(successResponse(users, 'Users retrieved'));
  });

  // 2. List conversations by tab ('primary' | 'requests' | 'archived')
  fastify.get('/messages/conversations', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { tab = 'primary', search } = request.query as {
      tab?: 'primary' | 'requests' | 'archived';
      search?: string;
    };
    const conversations = await service.getConversations(session.user.id, tab, search);
    return reply.send(successResponse(conversations, 'Conversations retrieved'));
  });

  // 3. Get or create a 1-to-1 direct conversation (supports both endpoints)
  const handleDirect = async (request: any, reply: any) => {
    const session = await fastify.authenticate(request, reply);
    const { recipientId } = request.body as { recipientId: string };
    const conv = await service.getOrCreateDirectConversation(session.user.id, recipientId);
    return reply.send(successResponse(conv, 'Direct conversation ready'));
  };
  fastify.post('/messages/conversations/direct', handleDirect);
  fastify.post('/messages/direct', handleDirect);

  // 4. Create a group conversation (supports both endpoints)
  const handleGroup = async (request: any, reply: any) => {
    const session = await fastify.authenticate(request, reply);
    const { title, image, memberIds } = request.body as {
      title: string;
      image?: string;
      memberIds?: string[];
    };
    const group = await service.createGroupConversation(
      session.user.id,
      title,
      image,
      memberIds || [],
    );
    return reply.send(successResponse(group, 'Group conversation created'));
  };
  fastify.post('/messages/conversations/group', handleGroup);
  fastify.post('/messages/groups', handleGroup);

  // 5. Add members to a group
  const handleAddMembers = async (request: any, reply: any) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const { memberIds } = request.body as { memberIds: string[] };
    const result = await service.addGroupMembers(conversationId, session.user.id, memberIds);
    return reply.send(successResponse(result, 'Members added to group'));
  };
  fastify.post('/messages/conversations/:conversationId/members', handleAddMembers);
  fastify.post('/messages/groups/:conversationId/members', handleAddMembers);

  // 6. Remove member / leave group
  const handleRemoveMember = async (request: any, reply: any) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId, targetUserId } = request.params as {
      conversationId: string;
      targetUserId: string;
    };
    const result = await service.removeGroupMember(conversationId, session.user.id, targetUserId);
    return reply.send(successResponse(result, 'Member removed from group'));
  };
  fastify.delete('/messages/conversations/:conversationId/members/:targetUserId', handleRemoveMember);
  fastify.delete('/messages/groups/:conversationId/members/:targetUserId', handleRemoveMember);

  // 7. Get message thread inside a conversation (supports pagination and search)
  fastify.get('/messages/conversations/:conversationId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const { cursor, limit, search } = request.query as {
      cursor?: string;
      limit?: string;
      search?: string;
    };
    const data = await service.getMessages(conversationId, session.user.id, {
      cursor,
      limit: limit ? parseInt(limit, 10) : 30,
      search,
    });
    return reply.send(successResponse(data, 'Messages retrieved'));
  });

  // 8. Send message (text, image, audio, file, reply)
  fastify.post('/messages/send', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const body = request.body as {
      conversationId?: string;
      recipientId?: string;
      content?: string;
      mediaUrl?: string;
      type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
      fileMeta?: any;
      replyToId?: string;
    };
    const message = await service.sendMessage(session.user.id, body);
    return reply.send(successResponse(message, 'বার্তা সফলভাবে পাঠানো হয়েছে'));
  });

  // 9. Edit message
  fastify.patch('/messages/:messageId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { messageId } = request.params as { messageId: string };
    const { content } = request.body as { content: string };
    const updated = await service.editMessage(messageId, session.user.id, content);
    return reply.send(successResponse(updated, 'বার্তা সম্পাদনা সম্পন্ন হয়েছে'));
  });

  // 10. Delete message
  fastify.delete('/messages/:messageId', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { messageId } = request.params as { messageId: string };
    const deleted = await service.deleteMessage(messageId, session.user.id);
    return reply.send(successResponse(deleted, 'বার্তা মুছে ফেলা হয়েছে'));
  });

  // 11. Toggle message reaction
  fastify.post('/messages/:messageId/reactions', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { messageId } = request.params as { messageId: string };
    const { emoji } = request.body as { emoji: string };
    const reactions = await service.toggleReaction(messageId, session.user.id, emoji);
    return reply.send(successResponse(reactions, 'প্রতিক্রিয়া আপডেট করা হয়েছে'));
  });

  // 12. Message Request: Accept
  const handleAccept = async (request: any, reply: any) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const accepted = await service.acceptRequest(conversationId, session.user.id);
    return reply.send(successResponse(accepted, 'মেসেজ রিকোয়েস্ট গ্রহণ করা হয়েছে'));
  };
  fastify.post('/messages/requests/:conversationId/accept', handleAccept);
  fastify.post('/messages/conversations/:conversationId/accept', handleAccept);

  // 13. Message Request: Decline
  const handleDecline = async (request: any, reply: any) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const result = await service.declineRequest(conversationId, session.user.id);
    return reply.send(successResponse(result, 'মেসেজ রিকোয়েস্ট বাতিল করা হয়েছে'));
  };
  fastify.post('/messages/requests/:conversationId/decline', handleDecline);
  fastify.post('/messages/conversations/:conversationId/decline', handleDecline);

  // 14. Message Request: Block
  const handleBlock = async (request: any, reply: any) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const result = await service.blockFromRequest(conversationId, session.user.id);
    return reply.send(successResponse(result, 'ব্যবহারকারীকে ব্লক করা হয়েছে'));
  };
  fastify.post('/messages/requests/:conversationId/block', handleBlock);
  fastify.post('/messages/conversations/:conversationId/block', handleBlock);

  // 15. Toggle pin conversation
  fastify.post('/messages/conversations/:conversationId/pin', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const result = await service.togglePin(conversationId, session.user.id);
    return reply.send(successResponse(result, 'পিন স্থিতি পরিবর্তিত হয়েছে'));
  });

  // 16. Toggle mute conversation
  fastify.post('/messages/conversations/:conversationId/mute', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const result = await service.toggleMute(conversationId, session.user.id);
    return reply.send(successResponse(result, 'মিউট স্থিতি পরিবর্তিত হয়েছে'));
  });

  // 17. Toggle archive conversation
  fastify.post('/messages/conversations/:conversationId/archive', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const result = await service.toggleArchive(conversationId, session.user.id);
    return reply.send(successResponse(result, 'আর্কাইভ স্থিতি পরিবর্তিত হয়েছে'));
  });

  // 18. Delete conversation from inbox (hide)
  fastify.delete('/messages/conversations/:conversationId/inbox', async (request, reply) => {
    const session = await fastify.authenticate(request, reply);
    const { conversationId } = request.params as { conversationId: string };
    const result = await service.deleteFromInbox(conversationId, session.user.id);
    return reply.send(successResponse(result, 'ইনবক্স থেকে কথোপকথন সরানো হয়েছে'));
  });

  // 19. Check online presence for a list of user IDs
  fastify.get('/messages/presence', async (request, reply) => {
    await fastify.authenticate(request, reply);
    const { userIds = '' } = request.query as { userIds?: string };
    const ids = userIds.split(',').filter(Boolean);
    const presenceMap: Record<string, boolean> = {};
    for (const id of ids) {
      presenceMap[id] = realtimeService.isUserOnline(id);
    }
    return reply.send(successResponse(presenceMap, 'Presence status retrieved'));
  });
};
