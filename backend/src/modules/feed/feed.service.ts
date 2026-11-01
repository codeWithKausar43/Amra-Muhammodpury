import { PrismaClient, Prisma } from '../../config/database.js';
import { FeedQueryInput, CreatePostInput, CreateCommentInput } from './feed.schema.js';
import { PostDto, CommentDto, StoryDto } from './feed.types.js';
import { NotFoundError, UnauthorizedError } from '../../errors/app-error.js';

export class FeedService {
  constructor(private readonly prisma: PrismaClient) {}

  public async getFeed(
    query: FeedQueryInput,
    currentUserId?: string,
  ): Promise<{ posts: PostDto[]; total: number; page: number; totalPages: number }> {
    const { page, limit, category, search } = query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Prisma.PostWhereInput = {
      isDeleted: false,
    };

    if (category === 'EMERGENCY') {
      where.isEmergency = true;
    } else if (category === 'MY_BLOCK') {
      where.blockBadge = { not: null };
    }

    if (search && search.trim()) {
      where.OR = [
        { content: { contains: search.trim(), mode: 'insensitive' } },
        { location: { contains: search.trim(), mode: 'insensitive' } },
        { blockBadge: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, posts] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: category === 'POPULAR' ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }] : { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              phone: true,
            },
          },
          media: {
            include: {
              media: true,
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              likes: true,
              comments: { where: { isDeleted: false } },
            },
          },
          likes: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { id: true },
              }
            : false,
          comments: {
            where: { isDeleted: false },
            take: 2,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const formattedPosts: PostDto[] = posts.map((post) => ({
      id: post.id,
      content: post.content,
      location: post.location,
      category: post.category,
      blockBadge: post.blockBadge,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post.sharesCount,
      hasLiked: Boolean(post.likes && post.likes.length > 0),
      isEmergency: post.isEmergency,
      emergencyData: post.emergencyData,
      createdAt: post.createdAt,
      author: post.author,
      media: post.media.map((pm) => ({
        id: pm.media.id,
        publicId: pm.media.publicId,
        secureUrl: pm.media.secureUrl,
        resourceType: pm.media.resourceType,
        format: pm.media.format,
        width: pm.media.width,
        height: pm.media.height,
      })),
      recentComments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.author,
      })),
    }));

    return {
      posts: formattedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async createPost(input: CreatePostInput, authorId: string): Promise<PostDto> {
    const post = await this.prisma.post.create({
      data: {
        content: input.content,
        location: input.location,
        category: input.category,
        blockBadge: input.blockBadge,
        isEmergency: input.isEmergency ?? false,
        emergencyData: (input.emergencyData as Prisma.InputJsonValue) ?? undefined,
        authorId,
        media: {
          create: input.mediaIds.map((mediaId, index) => ({
            mediaId,
            order: index,
          })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
            phone: true,
          },
        },
        media: {
          include: {
            media: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return {
      id: post.id,
      content: post.content,
      location: post.location,
      category: post.category,
      blockBadge: post.blockBadge,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      hasLiked: false,
      isEmergency: post.isEmergency,
      emergencyData: post.emergencyData,
      createdAt: post.createdAt,
      author: post.author,
      media: post.media.map((pm) => ({
        id: pm.media.id,
        publicId: pm.media.publicId,
        secureUrl: pm.media.secureUrl,
        resourceType: pm.media.resourceType,
        format: pm.media.format,
        width: pm.media.width,
        height: pm.media.height,
      })),
      recentComments: [],
    };
  }

  public async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundError('পোস্টটি পাওয়া যায়নি');
    }

    if (post.authorId !== userId) {
      throw new UnauthorizedError('এই পোস্টটি মুছে ফেলার অনুমতি আপনার নেই');
    }

    // Soft deletion to preserve data & audit trail
    await this.prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    });

    return true;
  }

  public async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const existing = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.postLike.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });
    }

    const likesCount = await this.prisma.postLike.count({
      where: { postId },
    });

    return {
      liked: !existing,
      likesCount,
    };
  }

  public async getComments(postId: string): Promise<CommentDto[]> {
    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: c.author,
    }));
  }

  public async createComment(postId: string, userId: string, input: CreateCommentInput): Promise<CommentDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.isDeleted) {
      throw new NotFoundError('পোস্টটি পাওয়া যায়নি');
    }

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: input.content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.author,
    };
  }

  public async getStories(): Promise<StoryDto[]> {
    const stories = await this.prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return stories.map((s) => ({
      id: s.id,
      title: s.title,
      mediaUrl: s.mediaUrl,
      author: s.author,
      createdAt: s.createdAt,
    }));
  }
}
