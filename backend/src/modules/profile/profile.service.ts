import { PrismaClient } from '../../config/database.js';
import { NotFoundError } from '../../errors/app-error.js';

export class ProfileService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getProfile(targetUserId: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
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
    let isSelf = targetUserId === currentUserId;

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
        ...user,
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
    data: { name?: string; bio?: string; image?: string; coverImage?: string },
  ) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.bio !== undefined ? { bio: data.bio.trim() } : {}),
        ...(data.image ? { image: data.image } : {}),
        ...(data.coverImage ? { coverImage: data.coverImage } : {}),
      },
      select: {
        id: true,
        name: true,
        image: true,
        coverImage: true,
        bio: true,
        role: true,
      },
    });

    return updated;
  }
}
