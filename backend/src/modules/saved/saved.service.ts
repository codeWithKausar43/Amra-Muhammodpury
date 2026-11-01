import { PrismaClient } from '../../config/database.js';
import { NotFoundError } from '../../errors/app-error.js';

export class SavedPostService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getSavedPosts(userId: string) {
    const saved = await this.prisma.savedPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: { select: { id: true, name: true, image: true, role: true } },
            media: { include: { media: true }, orderBy: { order: 'asc' } },
            _count: { select: { likes: true, comments: { where: { isDeleted: false } } } },
          },
        },
      },
    });

    return saved.map((s) => ({
      savedAt: s.createdAt,
      post: {
        id: s.post.id,
        content: s.post.content,
        location: s.post.location,
        category: s.post.category,
        blockBadge: s.post.blockBadge,
        likesCount: s.post._count.likes,
        commentsCount: s.post._count.comments,
        sharesCount: s.post.sharesCount,
        isEmergency: s.post.isEmergency,
        createdAt: s.post.createdAt.toISOString(),
        author: s.post.author,
        media: s.post.media.map((m) => m.media),
        hasSaved: true,
      },
    }));
  }

  public async toggleSave(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
    });
    if (!post) throw new NotFoundError('পোস্টটি পাওয়া যায়নি');

    const existing = await this.prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.savedPost.delete({
        where: { id: existing.id },
      });
      return { isSaved: false, message: 'পোস্টটি সংরক্ষিত তালিকা থেকে মুছে ফেলা হয়েছে' };
    }

    await this.prisma.savedPost.create({
      data: { userId, postId },
    });

    return { isSaved: true, message: 'পোস্টটি সফলভাবে সংরক্ষণ করা হয়েছে' };
  }
}
