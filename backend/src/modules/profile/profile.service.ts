import { PrismaClient } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../errors/app-error.js';

export class ProfileService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getProfile(targetUserId: string, currentUserId?: string) {
    if (targetUserId === 'me') {
      if (!currentUserId) throw new NotFoundError('ব্যবহারকারী পাওয়া যায়নি');
      targetUserId = currentUserId;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        coverImage: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            friendshipsA: true,
            posts: { where: { isDeleted: false } },
            groupMemberships: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundError('ব্যবহারকারী পাওয়া যায়নি');

    // Check relationship if current user
    let isFriend = false;
    const isSelf = targetUserId === currentUserId;

    if (currentUserId && !isSelf) {
      const friendship = await this.prisma.friendship.findUnique({
        where: { userId_friendId: { userId: currentUserId, friendId: targetUserId } },
      });
      isFriend = Boolean(friendship);
    }

    // Determine allowed post privacy levels
    const allowedPrivacy: string[] = ['PUBLIC'];
    if (isSelf) {
      allowedPrivacy.push('FRIENDS', 'ONLY_ME');
    } else if (isFriend) {
      allowedPrivacy.push('FRIENDS');
    }

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: targetUserId,
        isDeleted: false,
        privacy: { in: allowedPrivacy },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        media: { include: { media: true }, orderBy: { order: 'asc' } },
        _count: { select: { likes: true, comments: { where: { isDeleted: false } } } },
        likes: currentUserId ? { where: { userId: currentUserId }, select: { id: true } } : false,
      },
    });

    const formattedPosts = posts.map((p) => ({
      id: p.id,
      content: p.content,
      bgColor: p.bgColor,
      location: p.location,
      category: p.category,
      blockBadge: p.blockBadge,
      privacy: p.privacy,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      sharesCount: p.sharesCount,
      hasLiked: Boolean(p.likes && p.likes.length > 0),
      createdAt: p.createdAt.toISOString(),
      author: p.author,
      media: p.media.map((m) => m.media),
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: isSelf ? user.email : undefined,
        phone: isSelf ? user.phone : undefined,
        image: user.image,
        coverImage: user.coverImage,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
        friendsCount: user._count.friendshipsA,
        postsCount: user._count.posts,
        groupsCount: user._count.groupMemberships,
      },
      posts: formattedPosts,
      isSelf,
      isFriend,
    };
  }

  public async updateProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      bio?: string;
      image?: string;
      coverImage?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('ব্যবহারকারী পাওয়া যায়নি');

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      const name = data.name.trim();
      if (!name) throw new BadRequestError('নাম খালি রাখা যাবে না');
      updateData.name = name;
    }

    if (data.bio !== undefined) {
      updateData.bio = data.bio.trim();
    }

    if (data.image !== undefined) {
      updateData.image = data.image;
    }

    if (data.coverImage !== undefined) {
      updateData.coverImage = data.coverImage;
    }

    if (data.email !== undefined && data.email.trim() !== '') {
      const email = data.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new BadRequestError('সঠিক ইমেইল ঠিকানা প্রদান করুন');
      }
      if (email !== user.email) {
        const existingEmail = await this.prisma.user.findFirst({
          where: { email, id: { not: userId } },
        });
        if (existingEmail) {
          throw new BadRequestError('এই ইমেইলটি ইতিমধ্যে অন্য একটি অ্যাকাউন্টে ব্যবহার করা হয়েছে');
        }
        updateData.email = email;
      }
    }

    if (data.phone !== undefined && data.phone.trim() !== '') {
      const phone = data.phone.trim();
      const cleaned = phone.replace(/[\s\-]/g, '');
      const formatted = cleaned.startsWith('+88')
        ? cleaned
        : cleaned.startsWith('88')
          ? `+${cleaned}`
          : `+88${cleaned}`;

      if (!/^\+8801[3-9]\d{8}$/.test(formatted)) {
        throw new BadRequestError('সঠিক বাংলাদেশী মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)');
      }

      if (formatted !== user.phone) {
        const existingPhone = await this.prisma.user.findFirst({
          where: { phone: formatted, id: { not: userId } },
        });
        if (existingPhone) {
          throw new BadRequestError('এই ফোন নম্বরটি ইতিমধ্যে অন্য একটি অ্যাকাউন্টে ব্যবহার করা হয়েছে');
        }
        updateData.phone = formatted;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        coverImage: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });

    return updated;
  }
}
