import { PrismaClient } from '../../config/database.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../errors/app-error.js';

export interface CreateGroupInput {
  name: string;
  description?: string;
  privacy?: 'PUBLIC' | 'PRIVATE';
  rules?: string;
  image?: string;
  coverImage?: string;
}

export class GroupService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getGroups(userId?: string) {
    const [allPublic, userMemberships] = await Promise.all([
      this.prisma.group.findMany({
        where: { privacy: 'PUBLIC' },
        include: {
          _count: { select: { members: true, posts: true } },
          creator: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      userId
        ? this.prisma.groupMember.findMany({
            where: { userId },
            include: {
              group: {
                include: {
                  _count: { select: { members: true, posts: true } },
                  creator: { select: { id: true, name: true, image: true } },
                },
              },
            },
          })
        : [],
    ]);

    const joinedGroupIds = new Set(userMemberships.map((m) => m.groupId));
    const joined = userMemberships.map((m) => ({
      ...m.group,
      membershipRole: m.role,
    }));

    const discover = allPublic
      .filter((g) => !joinedGroupIds.has(g.id))
      .map((g) => ({
        ...g,
        membershipRole: null,
      }));

    return { joined, discover };
  }

  public async getGroup(groupId: string, userId?: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        _count: { select: { members: true, posts: true } },
        members: {
          take: 8,
          include: {
            user: { select: { id: true, name: true, image: true, role: true } },
          },
        },
      },
    });

    if (!group) throw new NotFoundError('গ্রুপটি পাওয়া যায়নি');

    let membershipRole: string | null = null;
    let pendingRequest = false;

    if (userId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
      });
      if (membership) {
        membershipRole = membership.role;
      } else {
        const req = await this.prisma.groupJoinRequest.findUnique({
          where: { groupId_userId: { groupId, userId } },
        });
        if (req && req.status === 'PENDING') {
          pendingRequest = true;
        }
      }
    }

    return {
      ...group,
      membershipRole,
      pendingRequest,
    };
  }

  public async createGroup(userId: string, input: CreateGroupInput) {
    if (!input.name || input.name.trim().length < 3) {
      throw new BadRequestError('গ্রুপের নাম কমপক্ষে ৩ অক্ষরের হতে হবে');
    }

    const group = await this.prisma.$transaction(async (tx) => {
      const newGroup = await tx.group.create({
        data: {
          name: input.name.trim(),
          description: input.description?.trim(),
          privacy: input.privacy || 'PUBLIC',
          rules: input.rules?.trim(),
          image: input.image,
          coverImage: input.coverImage,
          creatorId: userId,
        },
      });

      // Creator is OWNER
      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          userId,
          role: 'OWNER',
        },
      });

      return newGroup;
    });

    return group;
  }

  public async joinGroup(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundError('গ্রুপ পাওয়া যায়নি');

    const existingMember = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existingMember) throw new BadRequestError('আপনি ইতিমধ্যে এই গ্রুপের সদস্য');

    if (group.privacy === 'PUBLIC') {
      const member = await this.prisma.groupMember.create({
        data: { groupId, userId, role: 'MEMBER' },
      });
      return { status: 'JOINED', role: member.role, message: 'গ্রুপে সফলভাবে যুক্ত হয়েছেন' };
    }

    // Private group -> create Join Request
    const existingReq = await this.prisma.groupJoinRequest.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (existingReq) {
      if (existingReq.status === 'PENDING') {
        throw new BadRequestError('আপনার যোগদানের আবেদন ইতিমধ্যে অপেক্ষমাণ রয়েছে');
      }
      await this.prisma.groupJoinRequest.update({
        where: { id: existingReq.id },
        data: { status: 'PENDING' },
      });
    } else {
      await this.prisma.groupJoinRequest.create({
        data: { groupId, userId, status: 'PENDING' },
      });
    }

    // Notify group creator
    await this.prisma.notification.create({
      data: {
        recipientId: group.creatorId,
        actorId: userId,
        type: 'GROUP_JOIN_REQUEST',
        title: 'গ্রুপে যোগদানের আবেদন',
        content: `একটি নতুন সদস্য ${group.name} গ্রুপে যোগদানের আবেদন করেছেন।`,
        entityId: groupId,
        entityType: 'group',
      },
    });

    return { status: 'REQUEST_SENT', message: 'যোগদানের আবেদন সফলভাবে পাঠানো হয়েছে' };
  }

  public async leaveGroup(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new BadRequestError('আপনি এই গ্রুপের সদস্য নন');

    if (membership.role === 'OWNER') {
      const otherMembers = await this.prisma.groupMember.count({
        where: { groupId, userId: { not: userId } },
      });
      if (otherMembers > 0) {
        throw new BadRequestError('গ্রুপের মালিক হিসেবে ত্যাগ করার আগে অন্য কাউকে অ্যাডমিন নির্ধারণ করুন');
      }
    }

    await this.prisma.groupMember.delete({
      where: { id: membership.id },
    });

    return { success: true, message: 'গ্রুপ ত্যাগ করা হয়েছে' };
  }

  public async getGroupPosts(groupId: string, userId?: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundError('গ্রুপ পাওয়া যায়নি');

    if (group.privacy === 'PRIVATE') {
      if (!userId) throw new UnauthorizedError('প্রাইভেট গ্রুপের পোস্ট দেখতে লগইন করুন');
      const isMember = await this.prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
      });
      if (!isMember) throw new UnauthorizedError('প্রাইভেট গ্রুপের পোস্ট দেখতে গ্রুপে যুক্ত হোন');
    }

    const posts = await this.prisma.post.findMany({
      where: { groupId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        media: { include: { media: true }, orderBy: { order: 'asc' } },
        _count: { select: { likes: true, comments: { where: { isDeleted: false } } } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
      },
    });

    return posts.map((p) => ({
      id: p.id,
      content: p.content,
      location: p.location,
      category: p.category,
      blockBadge: p.blockBadge,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      sharesCount: p.sharesCount,
      hasLiked: Boolean(p.likes && p.likes.length > 0),
      createdAt: p.createdAt.toISOString(),
      author: p.author,
      media: p.media.map((m) => m.media),
    }));
  }

  public async createGroupPost(
    groupId: string,
    userId: string,
    input: { content: string; location?: string; mediaIds?: string[] },
  ) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new UnauthorizedError('গ্রুপে পোস্ট প্রকাশ করতে সদস্য হওয়া আবশ্যক');

    const post = await this.prisma.post.create({
      data: {
        content: input.content,
        location: input.location,
        authorId: userId,
        groupId,
        privacy: 'PUBLIC',
        ...(input.mediaIds && input.mediaIds.length > 0
          ? {
              media: {
                create: input.mediaIds.map((mediaId, index) => ({
                  mediaId,
                  order: index,
                })),
              },
            }
          : {}),
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        media: { include: { media: true } },
      },
    });

    return post;
  }

  public async getJoinRequests(groupId: string, adminId: string) {
    const adminMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: adminId } },
    });
    if (!adminMembership || !['OWNER', 'ADMIN'].includes(adminMembership.role)) {
      throw new UnauthorizedError('শুধুমাত্র গ্রুপের অ্যাডমিনরা আবেদন দেখতে পারেন');
    }

    const requests = await this.prisma.groupJoinRequest.findMany({
      where: { groupId, status: 'PENDING' },
      include: {
        user: { select: { id: true, name: true, image: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  public async approveJoinRequest(groupId: string, requestId: string, adminId: string) {
    const adminMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: adminId } },
    });
    if (!adminMembership || !['OWNER', 'ADMIN'].includes(adminMembership.role)) {
      throw new UnauthorizedError('অনুমতি নেই');
    }

    const req = await this.prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
      include: { group: true },
    });
    if (!req || req.groupId !== groupId) throw new NotFoundError('আবেদন পাওয়া যায়নি');

    await this.prisma.$transaction([
      this.prisma.groupMember.create({
        data: { groupId, userId: req.userId, role: 'MEMBER' },
      }),
      this.prisma.groupJoinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      }),
      this.prisma.notification.create({
        data: {
          recipientId: req.userId,
          actorId: adminId,
          type: 'GROUP_APPROVED',
          title: 'গ্রুপে যোগদানের আবেদন গৃহীত',
          content: `${req.group.name} গ্রুপে আপনার যোগদানের আবেদন গৃহীত হয়েছে।`,
          entityId: groupId,
          entityType: 'group',
        },
      }),
    ]);

    return { success: true, message: 'সদস্য অনুমোদন করা হয়েছে' };
  }

  public async rejectJoinRequest(groupId: string, requestId: string, adminId: string) {
    const adminMembership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: adminId } },
    });
    if (!adminMembership || !['OWNER', 'ADMIN'].includes(adminMembership.role)) {
      throw new UnauthorizedError('অনুমতি নেই');
    }

    await this.prisma.groupJoinRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });

    return { success: true, message: 'আবেদন প্রত্যাখ্যান করা হয়েছে' };
  }
}
