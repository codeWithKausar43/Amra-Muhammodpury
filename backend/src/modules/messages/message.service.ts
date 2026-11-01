import { PrismaClient } from '../../config/database.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors/app-error.js';

export class MessageService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const results = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.userOneId === userId ? conv.userTwoId : conv.userOneId;
        const [otherUser, unreadCount] = await Promise.all([
          this.prisma.user.findUnique({
            where: { id: otherUserId },
            select: { id: true, name: true, image: true, role: true },
          }),
          this.prisma.message.count({
            where: {
              conversationId: conv.id,
              recipientId: userId,
              isRead: false,
            },
          }),
        ]);

        return {
          id: conv.id,
          otherUser,
          lastMessage: conv.messages[0] || null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      }),
    );

    return results;
  }

  public async getMessages(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) throw new NotFoundError('কথোপকথন পাওয়া যায়নি');
    if (conv.userOneId !== userId && conv.userTwoId !== userId) {
      throw new UnauthorizedError('অনুমতি নেই');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Mark unread messages sent to this user as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    const otherUserId = conv.userOneId === userId ? conv.userTwoId : conv.userOneId;
    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, name: true, image: true, role: true },
    });

    return { messages, otherUser };
  }

  public async sendMessage(
    senderId: string,
    recipientId: string,
    content: string,
    mediaUrl?: string,
  ) {
    if (!content.trim() && !mediaUrl) {
      throw new BadRequestError('বার্তার বিষয়বস্তু খালি হতে পারে না');
    }

    if (senderId === recipientId) {
      throw new BadRequestError('নিজেকে বার্তা পাঠানো যাবে না');
    }

    // Canonical order for pair
    const [userOneId, userTwoId] =
      senderId < recipientId ? [senderId, recipientId] : [recipientId, senderId];

    // Find or create conversation
    let conv = await this.prisma.conversation.findUnique({
      where: { userOneId_userTwoId: { userOneId, userTwoId } },
    });

    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: { userOneId, userTwoId },
      });
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId,
        recipientId,
        content: content.trim(),
        mediaUrl,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Touch conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    return { ...message, conversationId: conv.id };
  }
}

