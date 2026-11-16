import { PrismaClient } from '../../config/database.js';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '../../errors/app-error.js';
import { realtimeService } from '../realtime/realtime.service.js';
import type { ConversationListItem, UserSearchItem } from './message.types.js';

export class MessageService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Search registered users for starting a new conversation
   */
  public async searchUsers(currentUserId: string, query: string): Promise<UserSearchItem[]> {
    const q = query.trim();
    if (!q) return [];

    // 1. Get blocked user IDs (both directions)
    const blockedRecords = await this.prisma.blockedUser.findMany({
      where: {
        OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
      },
    });
    const blockedIds = new Set(
      blockedRecords.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId)),
    );
    blockedIds.add(currentUserId);

    // 2. Search users by name or phone
    const users = await this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(blockedIds) },
        isSuspended: false,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        bio: true,
      },
      take: 20,
    });

    // 3. For each found user, check friendship and existing direct conversation
    const userIds = users.map((u) => u.id);
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { userId: currentUserId, friendId: { in: userIds } },
          { friendId: currentUserId, userId: { in: userIds } },
        ],
      },
    });
    const friendSet = new Set(
      friendships.map((f) => (f.userId === currentUserId ? f.friendId : f.userId)),
    );

    // 4. Find existing direct conversations
    const existingConversations = await this.prisma.conversation.findMany({
      where: {
        isGroup: false,
        OR: [
          { userOneId: currentUserId, userTwoId: { in: userIds } },
          { userTwoId: currentUserId, userOneId: { in: userIds } },
        ],
      },
      select: { id: true, userOneId: true, userTwoId: true },
    });

    const convMap = new Map<string, string>();
    for (const c of existingConversations) {
      const otherId = c.userOneId === currentUserId ? c.userTwoId : c.userOneId;
      if (otherId) {
        convMap.set(otherId, c.id);
      }
    }

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      image: u.image,
      role: u.role,
      bio: u.bio,
      isFriend: friendSet.has(u.id),
      existingConversationId: convMap.get(u.id) || null,
    }));
  }

  /**
   * List conversations for the authenticated user based on tab
   */
  public async getConversations(
    userId: string,
    tab: 'primary' | 'requests' | 'archived' = 'primary',
    search?: string,
  ): Promise<ConversationListItem[]> {
    // Ensure all direct conversations involving this user have ConversationMember records
    await this.ensureDirectConversationMembers(userId);

    const s = search?.trim().toLowerCase();

    // Query members for this user that are not hidden
    const memberRecords = await this.prisma.conversationMember.findMany({
      where: {
        userId,
        hiddenAt: null,
        ...(tab === 'archived' ? { isArchived: true } : { isArchived: false }),
      },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, image: true, role: true },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { conversation: { updatedAt: 'desc' } },
      ],
    });

    const results: ConversationListItem[] = [];

    // Collect all other user IDs to batch-query friendship
    const otherUserIds: string[] = [];
    for (const record of memberRecords) {
      const conv = record.conversation;
      if (!conv.isGroup) {
        const otherMember = conv.members.find((m) => m.userId !== userId);
        if (otherMember) otherUserIds.push(otherMember.userId);
      }
    }

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { userId, friendId: { in: otherUserIds } },
          { friendId: userId, userId: { in: otherUserIds } },
        ],
      },
    });
    const friendSet = new Set(
      friendships.map((f) => (f.userId === userId ? f.friendId : f.userId)),
    );

    for (const record of memberRecords) {
      const conv = record.conversation;

      // Filter by tab
      if (tab === 'primary') {
        // Direct conversation must be ACCEPTED (or groups are always primary)
        if (!conv.isGroup && conv.status !== 'ACCEPTED') {
          continue;
        }
      } else if (tab === 'requests') {
        // Must be non-group, PENDING, and recipient is current user (creator is other user)
        if (conv.isGroup || conv.status !== 'PENDING' || conv.creatorId === userId) {
          continue;
        }
      }

      let title = conv.title || '';
      let image = conv.image || null;
      let otherUserObj: any = null;

      if (!conv.isGroup) {
        const otherMember = conv.members.find((m) => m.userId !== userId);
        if (otherMember?.user) {
          title = otherMember.user.name;
          image = otherMember.user.image;
          otherUserObj = {
            id: otherMember.user.id,
            name: otherMember.user.name,
            image: otherMember.user.image,
            role: otherMember.user.role,
            isOnline: realtimeService.isUserOnline(otherMember.user.id),
            isFriend: friendSet.has(otherMember.user.id),
          };
        }
      }

      // Filter by search string if provided
      if (s && !title.toLowerCase().includes(s)) {
        continue;
      }

      // Calculate unread count for messages after member's lastReadAt
      const unreadCount = await this.prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          createdAt: record.lastReadAt ? { gt: record.lastReadAt } : undefined,
          isRead: false,
        },
      });

      const lastMsg = conv.messages[0] || null;

      results.push({
        id: conv.id,
        isGroup: conv.isGroup,
        title: title || 'কথোপকথন',
        image,
        status: conv.status,
        creatorId: conv.creatorId,
        otherUser: otherUserObj,
        members: conv.isGroup
          ? conv.members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              image: m.user.image,
              role: m.role,
            }))
          : undefined,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              content: lastMsg.isDeleted ? 'এই বার্তাটি মুছে ফেলা হয়েছে' : lastMsg.content,
              type: lastMsg.type,
              createdAt: lastMsg.createdAt,
              senderId: lastMsg.senderId,
              senderName: lastMsg.sender.name,
              isRead: lastMsg.isRead,
              isDeleted: lastMsg.isDeleted,
            }
          : null,
        unreadCount,
        isMuted: record.isMuted,
        isPinned: record.isPinned,
        isArchived: record.isArchived,
        updatedAt: conv.updatedAt,
      });
    }

    return results;
  }

  /**
   * Helper: ensure ConversationMember records exist for direct conversations
   */
  private async ensureDirectConversationMembers(userId: string) {
    const directConvs = await this.prisma.conversation.findMany({
      where: {
        isGroup: false,
        OR: [{ userOneId: userId }, { userTwoId: userId }],
        members: { none: { userId } },
      },
    });

    for (const c of directConvs) {
      if (c.userOneId) {
        await this.prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: c.id, userId: c.userOneId } },
          create: { conversationId: c.id, userId: c.userOneId },
          update: {},
        });
      }
      if (c.userTwoId) {
        await this.prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: c.id, userId: c.userTwoId } },
          create: { conversationId: c.id, userId: c.userTwoId },
          update: {},
        });
      }
    }
  }

  /**
   * Get or create a 1-to-1 direct conversation with open messaging rules
   */
  public async getOrCreateDirectConversation(senderId: string, recipientId: string) {
    if (senderId === recipientId) {
      throw new BadRequestError('নিজের সাথে বার্তা আদান-প্রদান সম্ভব নয়');
    }

    // Check if either user is blocked
    const isBlocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: senderId },
        ],
      },
    });
    if (isBlocked) {
      throw new ForbiddenError('যোগাযোগ অনুমোদিত নয়');
    }

    // Canonical order for direct pair
    const [userOneId, userTwoId] =
      senderId < recipientId ? [senderId, recipientId] : [recipientId, senderId];

    let conv = await this.prisma.conversation.findUnique({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, role: true } },
          },
        },
      },
    });

    if (!conv) {
      // Check if they are friends
      const isFriend = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: senderId, friendId: recipientId },
            { friendId: senderId, userId: recipientId },
          ],
        },
      });

      // Friends -> ACCEPTED directly. Non-friends -> PENDING message request
      const status = isFriend ? 'ACCEPTED' : 'PENDING';

      conv = await this.prisma.conversation.create({
        data: {
          userOneId,
          userTwoId,
          isGroup: false,
          status,
          creatorId: senderId,
          members: {
            create: [
              { userId: senderId, role: 'ADMIN' },
              { userId: recipientId, role: 'MEMBER' },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, image: true, role: true } },
            },
          },
        },
      });
    } else {
      // Re-enable conversation in inbox if previously hidden
      await this.prisma.conversationMember.upsert({
        where: { conversationId_userId: { conversationId: conv.id, userId: senderId } },
        create: { conversationId: conv.id, userId: senderId },
        update: { hiddenAt: null },
      });
      await this.prisma.conversationMember.upsert({
        where: { conversationId_userId: { conversationId: conv.id, userId: recipientId } },
        create: { conversationId: conv.id, userId: recipientId },
        update: {},
      });
    }

    const otherMember = conv.members.find((m) => m.userId !== senderId);
    return {
      ...conv,
      otherUser: otherMember?.user
        ? {
            ...otherMember.user,
            isOnline: realtimeService.isUserOnline(otherMember.user.id),
          }
        : null,
    };
  }

  /**
   * Create a group conversation
   */
  public async createGroupConversation(
    creatorId: string,
    title: string,
    image?: string,
    memberIds: string[] = [],
  ) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new BadRequestError('গ্রুপের একটি নাম প্রয়োজন');
    }

    // Deduplicate member IDs and ensure creator is included
    const allMemberIds = Array.from(new Set([creatorId, ...memberIds.filter(Boolean)]));

    const conv = await this.prisma.conversation.create({
      data: {
        isGroup: true,
        title: trimmedTitle,
        image: image || null,
        creatorId,
        status: 'ACCEPTED',
        members: {
          create: allMemberIds.map((uid) => ({
            userId: uid,
            role: uid === creatorId ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, role: true } },
          },
        },
      },
    });

    const creatorUser = conv.members.find((m) => m.userId === creatorId)?.user;
    const systemContent = `${creatorUser?.name || 'একজন সদস্য'} "${trimmedTitle}" গ্রুপ তৈরি করেছেন`;

    // Create system message
    const initialMsg = await this.prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: creatorId,
        content: systemContent,
        type: 'SYSTEM',
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Notify all members via WebSocket
    for (const uid of allMemberIds) {
      realtimeService.publishToUser(uid, 'CONVERSATION_UPDATED', {
        conversationId: conv.id,
        action: 'GROUP_CREATED',
        conversation: conv,
      });
    }

    return { ...conv, initialMessage: initialMsg };
  }

  /**
   * Add members to an existing group
   */
  public async addGroupMembers(conversationId: string, actorId: string, newMemberIds: string[]) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv || !conv.isGroup) {
      throw new NotFoundError('গ্রুপ কথোপকথন পাওয়া যায়নি');
    }

    const isMember = conv.members.some((m) => m.userId === actorId);
    if (!isMember) {
      throw new UnauthorizedError('আপনার এই গ্রুপে সদস্য যোগ করার অনুমতি নেই');
    }

    const existingUserIds = new Set(conv.members.map((m) => m.userId));
    const toAdd = newMemberIds.filter((uid) => uid && !existingUserIds.has(uid));

    if (toAdd.length === 0) {
      return { addedCount: 0 };
    }

    await this.prisma.conversationMember.createMany({
      data: toAdd.map((uid) => ({
        conversationId,
        userId: uid,
        role: 'MEMBER',
      })),
    });

    // Broadcast update
    for (const uid of [...Array.from(existingUserIds), ...toAdd]) {
      realtimeService.publishToUser(uid, 'CONVERSATION_UPDATED', {
        conversationId,
        action: 'MEMBERS_ADDED',
        addedUserIds: toAdd,
      });
    }

    return { addedCount: toAdd.length };
  }

  /**
   * Remove member or leave group
   */
  public async removeGroupMember(conversationId: string, actorId: string, targetUserId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv || !conv.isGroup) {
      throw new NotFoundError('গ্রুপ কথোপকথন পাওয়া যায়নি');
    }

    const actorMember = conv.members.find((m) => m.userId === actorId);
    if (!actorMember) {
      throw new UnauthorizedError('অনুমতি নেই');
    }

    // Only group admin can remove other members; any member can leave (actorId === targetUserId)
    if (actorId !== targetUserId && actorMember.role !== 'ADMIN') {
      throw new ForbiddenError('শুধুমাত্র অ্যাডমিন অন্য সদস্যকে রিমুভ করতে পারেন');
    }

    await this.prisma.conversationMember.deleteMany({
      where: { conversationId, userId: targetUserId },
    });

    // Broadcast removal
    for (const m of conv.members) {
      realtimeService.publishToUser(m.userId, 'CONVERSATION_UPDATED', {
        conversationId,
        action: actorId === targetUserId ? 'MEMBER_LEFT' : 'MEMBER_REMOVED',
        targetUserId,
      });
    }

    return { success: true };
  }

  /**
   * Get paginated messages in a conversation thread
   */
  public async getMessages(
    conversationId: string,
    userId: string,
    options: { cursor?: string; limit?: number; search?: string } = {},
  ) {
    const limit = Math.min(Math.max(options.limit || 30, 10), 100);
    const { cursor, search } = options;

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, role: true } },
          },
        },
      },
    });

    if (!conv) throw new NotFoundError('কথোপকথন পাওয়া যায়নি');

    const memberRecord = conv.members.find((m) => m.userId === userId);
    if (!memberRecord) {
      throw new UnauthorizedError('অনুমতি নেই');
    }

    const whereClause: any = {
      conversationId,
      ...(memberRecord.hiddenAt ? { createdAt: { gt: memberRecord.hiddenAt } } : {}),
    };

    if (search?.trim()) {
      whereClause.content = { contains: search.trim(), mode: 'insensitive' };
      whereClause.isDeleted = false;
    }

    const rawMessages = await this.prisma.message.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
        replyTo: {
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    const hasMore = rawMessages.length > limit;
    const messages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
    const nextCursor = hasMore && messages.length > 0 ? messages[messages.length - 1]?.id ?? null : null;

    // Reverse to chronological order (oldest to newest) for UI rendering
    messages.reverse();

    // Mark unread messages sent to this user as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Update member's lastReadAt
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    // Notify other members of read status
    const otherMembers = conv.members.filter((m) => m.userId !== userId);
    for (const om of otherMembers) {
      realtimeService.publishToUser(om.userId, 'MESSAGE_READ', {
        conversationId,
        readerId: userId,
        readAt: new Date(),
      });
    }

    let otherUser: any = null;
    if (!conv.isGroup) {
      const om = conv.members.find((m) => m.userId !== userId);
      if (om?.user) {
        otherUser = {
          ...om.user,
          isOnline: realtimeService.isUserOnline(om.user.id),
        };
      }
    }

    return {
      messages,
      otherUser,
      conversation: {
        id: conv.id,
        isGroup: conv.isGroup,
        title: conv.title,
        image: conv.image,
        status: conv.status,
        creatorId: conv.creatorId,
        members: conv.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          image: m.user.image,
          role: m.role,
        })),
        isMuted: memberRecord.isMuted,
        isPinned: memberRecord.isPinned,
        isArchived: memberRecord.isArchived,
      },
      hasMore,
      nextCursor,
    };
  }

  /**
   * Send message with Open Messaging restrictions and real-time delivery
   */
  public async sendMessage(
    senderId: string,
    data: {
      conversationId?: string;
      recipientId?: string;
      content?: string;
      mediaUrl?: string;
      type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO';
      fileMeta?: any;
      replyToId?: string;
    },
  ) {
    const { content, mediaUrl, type = 'TEXT', fileMeta, replyToId } = data;
    let conversationId = data.conversationId;

    if (!content?.trim() && !mediaUrl) {
      throw new BadRequestError('বার্তার বিষয়বস্তু খালি হতে পারে না');
    }

    // If conversationId is not provided, look up or create direct conversation with recipientId
    if (!conversationId) {
      if (!data.recipientId) {
        throw new BadRequestError('কথোপকথন বা প্রাপক নির্দেশ করা প্রয়োজন');
      }
      const directConv = await this.getOrCreateDirectConversation(senderId, data.recipientId);
      conversationId = directConv.id;
    }

    // Verify conversation existence and membership
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!conv) {
      throw new NotFoundError('কথোপকথন পাওয়া যায়নি');
    }

    const isMember = conv.members.some((m) => m.userId === senderId);
    if (!isMember) {
      throw new UnauthorizedError('আপনি এই কথোপকথনের সদস্য নন');
    }

    // Check blocking in direct conversation
    if (!conv.isGroup) {
      const otherMember = conv.members.find((m) => m.userId !== senderId);
      if (otherMember) {
        const isBlocked = await this.prisma.blockedUser.findFirst({
          where: {
            OR: [
              { blockerId: senderId, blockedId: otherMember.userId },
              { blockerId: otherMember.userId, blockedId: senderId },
            ],
          },
        });
        if (isBlocked) {
          throw new ForbiddenError('বার্তা পাঠানো সম্ভব নয় (ব্লক তালিকাভুক্ত)');
        }

        // Open Messaging Policy: if request is PENDING and current user is sender
        if (conv.status === 'PENDING' && conv.creatorId === senderId) {
          const sentCount = await this.prisma.message.count({
            where: { conversationId: conv.id, senderId },
          });
          if (sentCount >= 1) {
            throw new BadRequestError(
              'মেসেজ রিকোয়েস্ট এখনো গ্রহণ করা হয়নি। গ্রহীতা গ্রহণ করার পর আপনি আরো বার্তা পাঠাতে পারবেন।',
            );
          }
        }
      }
    }

    // Determine recipientId for 1-to-1 message
    const otherMember = conv.members.find((m) => m.userId !== senderId);
    const recipientId = conv.isGroup ? null : otherMember?.userId || null;

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId,
        recipientId,
        content: (content || '').trim(),
        mediaUrl: mediaUrl || null,
        type: mediaUrl && type === 'TEXT' ? 'IMAGE' : type,
        fileMeta: fileMeta || undefined,
        replyToId: replyToId || undefined,
      },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
        replyTo: {
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
        reactions: true,
      },
    });

    // Touch conversation updatedAt and unhide for members
    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });
    await this.prisma.conversationMember.updateMany({
      where: { conversationId: conv.id },
      data: { hiddenAt: null },
    });

    // Real-time broadcast to all members
    for (const member of conv.members) {
      if (member.userId === senderId) {
        realtimeService.publishToUser(senderId, 'MESSAGE_SENT', message);
      } else {
        realtimeService.publishToUser(member.userId, 'MESSAGE_RECEIVED', message);

        // If PENDING message request, send dedicated request event
        if (conv.status === 'PENDING') {
          realtimeService.publishToUser(member.userId, 'MESSAGE_REQUEST_RECEIVED', {
            conversationId: conv.id,
            sender: message.sender,
            content: message.content,
          });
        }
      }
    }

    return message;
  }

  /**
   * Edit own message
   */
  public async editMessage(messageId: string, userId: string, newContent: string) {
    const trimmed = newContent.trim();
    if (!trimmed) {
      throw new BadRequestError('বার্তার বিষয়বস্তু খালি হতে পারে না');
    }

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { members: true } } },
    });

    if (!message) throw new NotFoundError('বার্তা পাওয়া যায়নি');
    if (message.senderId !== userId) {
      throw new UnauthorizedError('শুধুমাত্র নিজের বার্তা সম্পাদনা করা যাবে');
    }
    if (message.isDeleted) {
      throw new BadRequestError('মুছে ফেলা বার্তা সম্পাদনা করা যায় না');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: trimmed,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        reactions: true,
      },
    });

    // Broadcast update to conversation members
    for (const m of message.conversation.members) {
      realtimeService.publishToUser(m.userId, 'MESSAGE_EDITED', updated);
    }

    return updated;
  }

  /**
   * Soft delete own message
   */
  public async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { members: true } } },
    });

    if (!message) throw new NotFoundError('বার্তা পাওয়া যায়নি');
    if (message.senderId !== userId) {
      throw new UnauthorizedError('শুধুমাত্র নিজের বার্তা মুছে ফেলা যাবে');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: 'এই বার্তাটি মুছে ফেলা হয়েছে',
        mediaUrl: null,
      },
    });

    // Broadcast deletion to conversation members
    for (const m of message.conversation.members) {
      realtimeService.publishToUser(m.userId, 'MESSAGE_DELETED', {
        messageId: message.id,
        conversationId: message.conversationId,
      });
    }

    return updated;
  }

  /**
   * Toggle emoji reaction on a message
   */
  public async toggleReaction(messageId: string, userId: string, emoji: string) {
    const trimmedEmoji = emoji.trim();
    if (!trimmedEmoji) throw new BadRequestError('ইমোজি প্রয়োজন');

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: { include: { members: true } } },
    });

    if (!message) throw new NotFoundError('বার্তা পাওয়া যায়নি');

    const isMember = message.conversation.members.some((m) => m.userId === userId);
    if (!isMember) throw new UnauthorizedError('অনুমতি নেই');

    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji: trimmedEmoji },
      },
    });

    if (existing) {
      // Remove reaction
      await this.prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      // Add reaction
      await this.prisma.messageReaction.create({
        data: { messageId, userId, emoji: trimmedEmoji },
      });
    }

    // Fetch updated reactions
    const allReactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: { select: { id: true, name: true } } },
    });

    // Broadcast reaction update
    for (const m of message.conversation.members) {
      realtimeService.publishToUser(m.userId, 'MESSAGE_REACTION', {
        messageId,
        conversationId: message.conversationId,
        reactions: allReactions,
      });
    }

    return allReactions;
  }

  /**
   * Accept a pending message request
   */
  public async acceptRequest(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) throw new NotFoundError('কথোপকথন পাওয়া যায়নি');

    const isMember = conv.members.some((m) => m.userId === userId);
    if (!isMember) throw new UnauthorizedError('অনুমতি নেই');

    if (conv.creatorId === userId) {
      throw new BadRequestError('আপনি নিজেই এই রিকোয়েস্টের প্রেরক');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'ACCEPTED' },
    });

    // Notify both users
    for (const m of conv.members) {
      realtimeService.publishToUser(m.userId, 'MESSAGE_REQUEST_UPDATED', {
        conversationId,
        status: 'ACCEPTED',
      });
    }

    return updated;
  }

  /**
   * Decline/delete a pending message request
   */
  public async declineRequest(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) throw new NotFoundError('কথোপকথন পাওয়া যায়নি');

    const isMember = conv.members.some((m) => m.userId === userId);
    if (!isMember) throw new UnauthorizedError('অনুমতি নেই');

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'DECLINED' },
    });

    // Hide from receiver's inbox
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { hiddenAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Block sender from message request
   */
  public async blockFromRequest(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conv) throw new NotFoundError('কথোপকথন পাওয়া যায়নি');

    const senderMember = conv.members.find((m) => m.userId !== userId);
    if (senderMember) {
      await this.prisma.blockedUser.upsert({
        where: {
          blockerId_blockedId: { blockerId: userId, blockedId: senderMember.userId },
        },
        create: { blockerId: userId, blockedId: senderMember.userId },
        update: {},
      });
    }

    await this.declineRequest(conversationId, userId);
    return { success: true };
  }

  /**
   * Toggle conversation pin
   */
  public async togglePin(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new NotFoundError('কথোপকথন পাওয়া যায়নি');

    const updated = await this.prisma.conversationMember.update({
      where: { id: member.id },
      data: { isPinned: !member.isPinned },
    });
    return { isPinned: updated.isPinned };
  }

  /**
   * Toggle conversation mute
   */
  public async toggleMute(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new NotFoundError('কথোপকথন পাওয়া যায়নি');

    const updated = await this.prisma.conversationMember.update({
      where: { id: member.id },
      data: { isMuted: !member.isMuted },
    });
    return { isMuted: updated.isMuted };
  }

  /**
   * Toggle conversation archive
   */
  public async toggleArchive(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new NotFoundError('কথোপকথন পাওয়া যায়নি');

    const updated = await this.prisma.conversationMember.update({
      where: { id: member.id },
      data: { isArchived: !member.isArchived },
    });
    return { isArchived: updated.isArchived };
  }

  /**
   * Delete conversation from current user's inbox (sets hiddenAt)
   */
  public async deleteFromInbox(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new NotFoundError('কথোপকথন পাওয়া যায়নি');

    await this.prisma.conversationMember.update({
      where: { id: member.id },
      data: { hiddenAt: new Date() },
    });
    return { success: true };
  }
}
