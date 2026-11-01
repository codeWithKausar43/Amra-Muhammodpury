import { PrismaClient } from '../../config/database.js';
import { BadRequestError } from '../../errors/app-error.js';

export interface CreateReportInput {
  targetType: 'POST' | 'COMMENT' | 'USER' | 'GROUP';
  targetId: string;
  reason: string;
  details?: string;
}

export class SafetyService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getBlockedUsers(userId: string) {
    const blocked = await this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      include: {
        blocked: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return blocked.map((b) => b.blocked);
  }

  public async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestError('নিজেকে ব্লক করা যাবে না');
    }

    await this.prisma.$transaction([
      this.prisma.blockedUser.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        update: {},
        create: { blockerId, blockedId },
      }),
      // Sever friendships
      this.prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId: blockerId, friendId: blockedId },
            { userId: blockedId, friendId: blockerId },
          ],
        },
      }),
      // Remove friend requests
      this.prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: blockedId },
            { senderId: blockedId, receiverId: blockerId },
          ],
        },
      }),
    ]);

    return { success: true, message: 'ব্যবহারকারীকে ব্লক করা হয়েছে' };
  }

  public async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.blockedUser.deleteMany({
      where: { blockerId, blockedId },
    });
    return { success: true, message: 'আনব্লক সম্পন্ন হয়েছে' };
  }

  public async createReport(reporterId: string, input: CreateReportInput) {
    if (!input.reason?.trim()) {
      throw new BadRequestError('রিপোর্টের কারণ উল্লেখ করা আবশ্যক');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason.trim(),
        details: input.details?.trim(),
        postId: input.targetType === 'POST' ? input.targetId : null,
      },
    });

    return report;
  }
}

