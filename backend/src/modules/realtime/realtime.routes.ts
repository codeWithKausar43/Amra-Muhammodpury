import { FastifyPluginAsync } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { realtimeService } from './realtime.service.js';
import type { ClientInboundMessage } from './realtime.types.js';

export const realtimeRoutes: FastifyPluginAsync = async (fastify) => {
  // WebSocket upgrade endpoint at /ws
  fastify.get('/ws', { websocket: true }, async (socket, request) => {
    let userId: string | null = null;
    let userRole: string | null = null;
    let isAdminOrOfficer = false;

    // 1. Try URL query param e.g. /ws?userId=...
    const query = request.query as { userId?: string } | undefined;
    if (query?.userId) {
      userId = query.userId;
    }

    // 2. Try session headers
    try {
      const headers = fromNodeHeaders(request.headers);
      const session = await fastify.auth.api.getSession({ headers });

      if (session?.user) {
        userId = session.user.id;
        userRole = session.user.role || null;

        if (userRole === 'ADMIN') {
          isAdminOrOfficer = true;
        } else if (userId) {
          const membership = await fastify.prisma.orgMembership.findUnique({
            where: { userId },
            select: { status: true, orgRole: true },
          });

          if (
            membership &&
            membership.status === 'ACTIVE' &&
            ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN'].includes(membership.orgRole)
          ) {
            isAdminOrOfficer = true;
          }
        }
      }
    } catch {
      // Anonymous public guest connection
    }

    const client = realtimeService.registerClient(socket, {
      userId,
      role: userRole,
      isAdminOrOfficer,
    });

    // Send connection greeting with assigned channels
    socket.send(
      JSON.stringify({
        type: 'CONNECTED',
        clientId: client.id,
        userId: client.userId,
        isAdminOrOfficer: client.isAdminOrOfficer,
        channels: Array.from(client.subscriptions),
        serverTime: Date.now(),
      }),
    );

    // Inbound frame handling
    socket.on('message', async (raw: any) => {
      try {
        const text = typeof raw === 'string' ? raw : raw.toString('utf8');
        const msg = JSON.parse(text) as ClientInboundMessage;

        if (msg.type === 'PING') {
          socket.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          return;
        }

        if (msg.type === 'AUTH' && msg.userId) {
          try {
            const user = await fastify.prisma.user.findUnique({
              where: { id: msg.userId },
              select: { id: true, role: true },
            });
            if (user) {
              let isAdm = user.role === 'ADMIN';
              if (!isAdm) {
                const membership = await fastify.prisma.orgMembership.findUnique({
                  where: { userId: user.id },
                  select: { status: true, orgRole: true },
                });
                if (
                  membership &&
                  membership.status === 'ACTIVE' &&
                  ['PRESIDENT', 'TREASURER', 'MODERATOR', 'ADMIN'].includes(membership.orgRole)
                ) {
                  isAdm = true;
                }
              }
              realtimeService.bindUser(client, user.id, user.role, isAdm);
              socket.send(
                JSON.stringify({
                  type: 'AUTHENTICATED',
                  userId: user.id,
                  channels: Array.from(client.subscriptions),
                }),
              );
            }
          } catch {
            // Ignore auth lookup errors
          }
          return;
        }

        if (msg.type === 'SUBSCRIBE' && msg.channel) {
          const success = realtimeService.subscribe(client, msg.channel);
          socket.send(
            JSON.stringify({
              type: 'SUBSCRIBED',
              channel: msg.channel,
              success,
            }),
          );
          return;
        }

        if (msg.type === 'UNSUBSCRIBE' && msg.channel) {
          realtimeService.unsubscribe(client, msg.channel);
          socket.send(
            JSON.stringify({
              type: 'UNSUBSCRIBED',
              channel: msg.channel,
            }),
          );
          return;
        }

        if (msg.type === 'TYPING' && client.userId && msg.conversationId) {
          // Broadcast typing status to conversation members
          fastify.prisma.conversationMember
            .findMany({
              where: { conversationId: msg.conversationId },
              select: { userId: true },
            })
            .then((members) => {
              const otherUserIds = members
                .map((m) => m.userId)
                .filter((id) => id !== client.userId);
              for (const uid of otherUserIds) {
                realtimeService.publishToUser(uid, 'TYPING_STATUS', {
                  conversationId: msg.conversationId,
                  userId: client.userId,
                  isTyping: Boolean(msg.isTyping),
                });
              }
            })
            .catch(() => {});
          return;
        }
      } catch {
        // Ignore malformed client frame
      }
    });
  });

  // REST diagnostics endpoint
  fastify.get('/stats', async () => {
    return {
      success: true,
      data: realtimeService.getStats(),
    };
  });
};
