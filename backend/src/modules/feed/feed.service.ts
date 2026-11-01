import { PrismaClient, Prisma } from '../../config/database.js';
import {
  FeedQueryInput,
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
} from './feed.schema.js';
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
      groupId: null, // General feed shows standalone community posts
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
        orderBy:
          category === 'POPULAR'
            ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
            : { createdAt: 'desc' },
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
          sharedPost: {
            include: {
              author: { select: { id: true, name: true, image: true, role: true } },
              media: { include: { media: true } },
            },
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
          savedBy: currentUserId
            ? {
                where: { userId: currentUserId },
                select: { id: true },
              }
            : false,
          comments: {
            where: { isDeleted: false },
            take: 3,
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
      privacy: post.privacy,
      groupId: post.groupId,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post.sharesCount,
      hasLiked: Boolean(post.likes && post.likes.length > 0),
      hasSaved: Boolean(post.savedBy && post.savedBy.length > 0),
      isEmergency: post.isEmergency,
      emergencyData: post.emergencyData,
      createdAt: post.createdAt,
      author: post.author,
      sharedPost: post.sharedPost
        ? {
            id: post.sharedPost.id,
            content: post.sharedPost.content,
            location: post.sharedPost.location,
            category: post.sharedPost.category,
            blockBadge: post.sharedPost.blockBadge,
            privacy: post.sharedPost.privacy,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: post.sharedPost.sharesCount,
            hasLiked: false,
            isEmergency: post.sharedPost.isEmergency,
            createdAt: post.sharedPost.createdAt,
            author: post.sharedPost.author,
            media: post.sharedPost.media.map((pm) => ({
              id: pm.media.id,
              publicId: pm.media.publicId,
              secureUrl: pm.media.secureUrl,
              resourceType: pm.media.resourceType,
              format: pm.media.format,
              width: pm.media.width,
              height: pm.media.height,
            })),
            recentComments: [],
          }
        : null,
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
        parentId: c.parentId,
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
        privacy: input.privacy ?? 'PUBLIC',
        groupId: input.groupId,
        sharedPostId: input.sharedPostId,
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
      privacy: post.privacy,
      groupId: post.groupId,
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

  public async editPost(postId: string, userId: string, input: UpdatePostInput): Promise<PostDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
    });

    if (!post) throw new NotFoundError('পোস্টটি পাওয়া যায়নি');
    if (post.authorId !== userId) {
      throw new UnauthorizedError('পোস্ট সম্পাদনা করার অনুমতি নেই');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.privacy !== undefined ? { privacy: input.privacy } : {}),
      },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        media: { include: { media: true } },
        _count: { select: { likes: true, comments: { where: { isDeleted: false } } } },
      },
    });

    return {
      id: updated.id,
      content: updated.content,
      location: updated.location,
      category: updated.category,
      blockBadge: updated.blockBadge,
      privacy: updated.privacy,
      likesCount: updated._count.likes,
      commentsCount: updated._count.comments,
      sharesCount: updated.sharesCount,
      hasLiked: false,
      isEmergency: updated.isEmergency,
      emergencyData: updated.emergencyData,
      createdAt: updated.createdAt,
      author: updated.author,
      media: updated.media.map((pm) => pm.media),
      recentComments: [],
    };
  }

  public async sharePost(postId: string, userId: string, caption?: string): Promise<PostDto> {
    const originalPost = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
    });
    if (!originalPost) throw new NotFoundError('মূল পোস্টটি পাওয়া যায়নি');

    // Create shared post
    const [shared] = await this.prisma.$transaction([
      this.prisma.post.create({
        data: {
          content: caption?.trim() || '',
          authorId: userId,
          sharedPostId: postId,
          privacy: 'PUBLIC',
        },
        include: {
          author: { select: { id: true, name: true, image: true, role: true } },
          media: { include: { media: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { sharesCount: { increment: 1 } },
      }),
      ...(originalPost.authorId !== userId
        ? [
            this.prisma.notification.create({
              data: {
                recipientId: originalPost.authorId,
                actorId: userId,
                type: 'POST_SHARE',
                title: 'পোস্ট শেয়ার',
                content: `একজন সদস্য আপনার পোস্টটি শেয়ার করেছেন।`,
                entityId: postId,
                entityType: 'post',
              },
            }),
          ]
        : []),
    ]);

    return {
      id: shared.id,
      content: shared.content,
      location: shared.location,
      category: shared.category,
      blockBadge: shared.blockBadge,
      privacy: shared.privacy,
      sharedPostId: postId,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      hasLiked: false,
      isEmergency: false,
      createdAt: shared.createdAt,
      author: shared.author,
      media: [],
      recentComments: [],
    };
  }

  public async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundError('পোস্টটি পাওয়া যায়নি');
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

  public async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('পোস্ট পাওয়া যায়নি');

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

      // Notify post author if not self
      if (post.authorId !== userId) {
        await this.prisma.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: userId,
            type: 'POST_LIKE',
            title: 'নতুন লাইক',
            content: 'আপনার পোস্টে একটি নতুন লাইক পড়েছে।',
            entityId: postId,
            entityType: 'post',
          },
        });
      }
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
      parentId: c.parentId,
      createdAt: c.createdAt,
      author: c.author,
    }));
  }

  public async createComment(
    postId: string,
    userId: string,
    input: CreateCommentInput,
  ): Promise<CommentDto> {
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
        parentId: input.parentId,
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

    // Send notification to post author or parent comment author
    if (post.authorId !== userId) {
      await this.prisma.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: userId,
          type: input.parentId ? 'COMMENT_REPLY' : 'POST_COMMENT',
          title: input.parentId ? 'মন্তব্যের রিপ্লাই' : 'নতুন মন্তব্য',
          content: `${comment.author.name} আপনার পোস্টে একটি মন্তব্য করেছেন।`,
          entityId: postId,
          entityType: 'post',
        },
      });
    }

    return {
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      author: comment.author,
    };
  }

  public async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundError('মন্তব্যটি পাওয়া যায়নি');
    if (comment.authorId !== userId) {
      throw new UnauthorizedError('মন্তব্য মুছে ফেলার অনুমতি নেই');
    }

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true },
    });

    return true;
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
