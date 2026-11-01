import { PrismaClient } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../errors/app-error.js';

export interface FriendUserSummary {
  id: string;
  name: string;
  image: string | null;
  phone: string | null;
  role: string;
  bio: string | null;
}

export class FriendService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getFriends(userId: string): Promise<FriendUserSummary[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            image: true,
            phone: true,
            role: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return friendships.map((f) => f.friend);
  }

  public async getRequests(userId: string) {
    const [incoming, sent] = await Promise.all([
      this.prisma.friendRequest.findMany({
        where: { receiverId: userId, status: 'PENDING' },
        include: {
          sender: {
            select: { id: true, name: true, image: true, phone: true, role: true, bio: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.friendRequest.findMany({
        where: { senderId: userId, status: 'PENDING' },
        include: {
          receiver: {
            select: { id: true, name: true, image: true, phone: true, role: true, bio: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { incoming, sent };
  }

  public async getSuggestions(userId: string, limit: number = 10) {
    // 1. Get existing friends & pending requests
    const [friendships, sentReqs, receivedReqs] = await Promise.all([
      this.prisma.friendship.findMany({
        where: { userId },
        select: { friendId: true },
      }),
      this.prisma.friendRequest.findMany({
        where: { senderId: userId, status: 'PENDING' },
        select: { receiverId: true },
      }),
      this.prisma.friendRequest.findMany({
        where: { receiverId: userId, status: 'PENDING' },
        select: { senderId: true },
      }),
    ]);

    const excludedIds = new Set<string>([
      userId,
      ...friendships.map((f) => f.friendId),
      ...sentReqs.map((r) => r.receiverId),
      ...receivedReqs.map((r) => r.senderId),
    ]);

    // 2. Query potential candidates
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludedIds) },
      },
      select: {
        id: true,
        name: true,
        image: true,
        role: true,
        bio: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // 3. Calculate mutual friends for each candidate
    const userFriendIds = new Set(friendships.map((f) => f.friendId));

    const suggestions = await Promise.all(
      candidates.map(async (candidate) => {
        const candidateFriends = await this.prisma.friendship.findMany({
          where: { userId: candidate.id },
          select: { friendId: true },
        });

        const mutualCount = candidateFriends.filter((cf) => userFriendIds.has(cf.friendId)).length;

        return {
          ...candidate,
          mutualFriendsCount: mutualCount,
        };
      }),
    );

    return suggestions.sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount);
  }

  public async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestError('আপনি নিজেকে ফ্রেন্ড রিকোয়েস্ট পাঠাতে পারবেন না');
    }

    // Check if already friends
    const existingFriendship = await this.prisma.friendship.findUnique({
      where: {
        userId_friendId: { userId: senderId, friendId: receiverId },
      },
    });

    if (existingFriendship) {
      throw new BadRequestError('আপনারা ইতিমধ্যে পরস্পরের বন্ধু');
    }

    // Check if request already exists
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        if (existingRequest.senderId === senderId) {
          throw new BadRequestError('রিকোয়েস্ট ইতিমধ্যে পাঠানো হয়েছে');
        } else {
          throw new BadRequestError('ব্যবহারকারী আপনাকে ইতিমধ্যে রিকোয়েস্ট পাঠিয়েছেন। সেটি এক্সেপ্ট করুন।');
        }
      }
      // If rejected or cancelled before, update it to PENDING
      const updated = await this.prisma.friendRequest.update({
        where: { id: existingRequest.id },
        data: { senderId, receiverId, status: 'PENDING' },
      });
      return updated;
    }

    // Create new request
    const request = await this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    // Trigger notification
    await this.prisma.notification.create({
      data: {
        recipientId: receiverId,
        actorId: senderId,
        type: 'FRIEND_REQUEST',
        title: 'নতুন ফ্রেন্ড রিকোয়েস্ট',
        content: `${request.sender.name} আপনাকে ফ্রেন্ড রিকোয়েস্ট পাঠিয়েছেন।`,
        entityId: request.id,
        entityType: 'user',
      },
    });

    return request;
  }

  public async acceptRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    if (!request || request.receiverId !== userId) {
      throw new NotFoundError('রিকোয়েস্ট পাওয়া যায়নি');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestError('এই রিকোয়েস্টটি আর পেন্ডিং নেই');
    }

    // Transaction to update request and create reciprocal friendships
    await this.prisma.$transaction([
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.friendship.upsert({
        where: { userId_friendId: { userId: request.senderId, friendId: request.receiverId } },
        update: {},
        create: { userId: request.senderId, friendId: request.receiverId },
      }),
      this.prisma.friendship.upsert({
        where: { userId_friendId: { userId: request.receiverId, friendId: request.senderId } },
        update: {},
        create: { userId: request.receiverId, friendId: request.senderId },
      }),
      this.prisma.notification.create({
        data: {
          recipientId: request.senderId,
          actorId: userId,
          type: 'FRIEND_ACCEPT',
          title: 'ফ্রেন্ড রিকোয়েস্ট গৃহীত হয়েছে',
          content: `${request.receiver.name} আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন।`,
          entityId: userId,
          entityType: 'user',
        },
      }),
    ]);

    return { success: true, message: 'ফ্রেন্ড রিকোয়েস্ট গৃহীত হয়েছে' };
  }

  public async rejectRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== userId) {
      throw new NotFoundError('রিকোয়েস্ট পাওয়া যায়নি');
    }

    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { success: true, message: 'রিকোয়েস্ট প্রত্যাখ্যান করা হয়েছে' };
  }

  public async cancelRequest(userId: string, requestId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.senderId !== userId) {
      throw new NotFoundError('রিকোয়েস্ট পাওয়া যায়নি');
    }

    await this.prisma.friendRequest.delete({
      where: { id: requestId },
    });

    return { success: true, message: 'রিকোয়েস্ট বাতিল করা হয়েছে' };
  }

  public async removeFriend(userId: string, friendId: string) {
    await this.prisma.$transaction([
      this.prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      }),
      this.prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId },
          ],
        },
      }),
    ]);

    return { success: true, message: 'বন্ধু তালিকা থেকে সরানো হয়েছে' };
  }

  public async getStatus(userId: string, targetUserId: string) {
    if (userId === targetUserId) return { status: 'SELF' };

    const friendship = await this.prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId: targetUserId } },
    });
    if (friendship) return { status: 'FRIENDS' };

    const pendingSent = await this.prisma.friendRequest.findFirst({
      where: { senderId: userId, receiverId: targetUserId, status: 'PENDING' },
    });
    if (pendingSent) return { status: 'REQUEST_SENT', requestId: pendingSent.id };

    const pendingReceived = await this.prisma.friendRequest.findFirst({
      where: { senderId: targetUserId, receiverId: userId, status: 'PENDING' },
    });
    if (pendingReceived) return { status: 'REQUEST_RECEIVED', requestId: pendingReceived.id };

    return { status: 'NONE' };
  }
}
