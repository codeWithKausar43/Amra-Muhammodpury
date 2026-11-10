import { PrismaClient, Prisma } from '../../config/database.js';
import {
  FeedQueryInput,
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
} from './feed.schema.js';
import { PostDto, CommentDto, StoryDto, ReactionType, AuthorSummary } from './feed.types.js';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../errors/app-error.js';

const AUTHOR_SELECT = {
  id: true,
  name: true,
  image: true,
  role: true,
  phone: true,
  orgMemberships: {
    select: {
      status: true,
      orgRole: true,
    },
  },
} as const;

export class FeedService {
  constructor(private readonly prisma: PrismaClient) {}

  private mapAuthor(author: any): AuthorSummary {
    if (!author) {
      return {
        id: '',
        name: 'সদস্য',
        role: 'USER',
        isOrgMember: false,
      };
    }

    const isOrgMember =
      author.role === 'ADMIN' ||
      (Array.isArray(author.orgMemberships) &&
        author.orgMemberships.some(
          (m: any) => m.status === 'ACTIVE' || m.status === 'APPROVED_PAYMENT_PENDING',
        )) ||
      false;

    return {
      id: author.id,
      name: author.name,
      image: author.image,
      role: author.role,
      phone: author.phone,
      isOrgMember,
    };
  }

  public async getFeed(
    query: FeedQueryInput,
    currentUserId?: string,
  ): Promise<{ posts: PostDto[]; total: number; page: number; totalPages: number }> {
    const { page, limit, category, search } = query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: Prisma.PostWhereInput = {
      isDeleted: false,
      status: 'PUBLISHED',
      groupId: null, // General feed shows standalone community posts
    };

    if (category === 'EMERGENCY') {
      where.isEmergency = true;
    } else if (category === 'MY_POSTS' || category === 'MY_BLOCK') {
      if (currentUserId) {
        where.authorId = currentUserId;
        delete where.status; // Author sees both their published and draft posts
      } else {
        where.authorId = '00000000-0000-0000-0000-000000000000';
      }
    } else if (category === 'LIVE') {
      where.createdAt = {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
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
            select: AUTHOR_SELECT,
          },
          media: {
            include: {
              media: true,
            },
            orderBy: { order: 'asc' },
          },
          sharedPost: {
            include: {
              author: { select: AUTHOR_SELECT },
              media: { include: { media: true } },
            },
          },
          _count: {
            select: {
              likes: true,
              comments: { where: { isDeleted: false } },
            },
          },
          likes: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              type: true,
              userId: true,
              user: { select: { name: true } },
            },
          },
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
                select: AUTHOR_SELECT,
              },
            },
          },
        },
      }),
    ]);

    const userLikes = currentUserId
      ? await this.prisma.postLike.findMany({
          where: {
            postId: { in: posts.map((p) => p.id) },
            userId: currentUserId,
          },
          select: { postId: true, type: true },
        })
      : [];
    const userLikeMap = new Map(userLikes.map((l) => [l.postId, l.type as ReactionType]));

    const formattedPosts: PostDto[] = posts.map((post) => {
      const userReaction = userLikeMap.get(post.id) || null;
      const topReactions = Array.from(new Set(post.likes.map((l) => l.type as ReactionType)));
      const recentLikers = post.likes.map((l) => l.user.name);

      return {
      id: post.id,
      content: post.content,
      bgColor: post.bgColor,
      location: post.location,
      category: post.category,
      blockBadge: post.blockBadge,
      privacy: post.privacy,
      groupId: post.groupId,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      sharesCount: post.sharesCount,
      status: post.status,
      hasLiked: Boolean(userReaction),
        userReaction,
        topReactions,
        recentLikers,
      hasSaved: Boolean(post.savedBy && post.savedBy.length > 0),
      isEmergency: post.isEmergency,
      emergencyData: post.emergencyData,
      createdAt: post.createdAt,
      author: this.mapAuthor(post.author),
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
            author: this.mapAuthor(post.sharedPost.author),
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
        author: this.mapAuthor(c.author),
      })),
    };
  });

    return {
      posts: formattedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async createPost(input: CreatePostInput, authorId: string): Promise<PostDto> {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { isSuspended: true, suspendedReason: true },
    });
    if (author?.isSuspended) {
      throw new ForbiddenError(author.suspendedReason || 'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Suspended) করা হয়েছে। নতুন পোস্ট তৈরি সম্ভব নয়।');
    }

    const blockBadge = input.blockBadge || input.blockName || null;
    const post = await this.prisma.post.create({
      data: {
        content: input.content || '',
        location: input.location,
        category: input.category,
        blockBadge,
        privacy: input.privacy ?? 'PUBLIC',
        bgColor: input.bgColor,
        groupId: input.groupId,
        sharedPostId: input.sharedPostId,
        isEmergency: input.isEmergency ?? false,
        emergencyData: (input.emergencyData as Prisma.InputJsonValue) ?? undefined,
        authorId,
        media: {
          create: (input.mediaIds || []).map((mediaId, index) => ({
            mediaId,
            order: index,
          })),
        },
      },
      include: {
        author: {
          select: AUTHOR_SELECT,
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
      bgColor: post.bgColor,
      location: post.location,
      category: post.category,
      blockBadge: post.blockBadge,
      privacy: post.privacy,
      groupId: post.groupId,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      hasLiked: false,
      userReaction: null,
      topReactions: [],
      recentLikers: [],
      isEmergency: post.isEmergency,
      emergencyData: post.emergencyData,
      createdAt: post.createdAt,
      author: this.mapAuthor(post.author),
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
        author: { select: AUTHOR_SELECT },
        media: { include: { media: true } },
        _count: { select: { likes: true, comments: { where: { isDeleted: false } } } },
      },
    });

    return {
      id: updated.id,
      content: updated.content,
      bgColor: updated.bgColor,
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
      author: this.mapAuthor(updated.author),
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
          author: { select: AUTHOR_SELECT },
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
      bgColor: shared.bgColor,
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
      author: this.mapAuthor(shared.author),
      media: [],
      recentComments: [],
    };
  }

  public async deletePost(postId: string, userId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundError('পোস্টটি পাওয়া যায়নি');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    const isSystemAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'itskausarprodhan@gmail.com';

    if (post.authorId !== userId && !isSystemAdmin) {
      throw new UnauthorizedError('এই পোস্টটি মুছে ফেলার অনুমতি আপনার নেই');
    }

    // Soft deletion to preserve data & audit trail
    await this.prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    });

    return true;
  }

  public async togglePostDraft(postId: string, userId: string, targetStatus?: 'PUBLISHED' | 'DRAFT'): Promise<{ id: string; status: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundError('পোস্টটি পাওয়া যায়নি');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });
    const isSystemAdmin = user?.role === 'SUPER_ADMIN' || user?.email === 'itskausarprodhan@gmail.com';

    if (post.authorId !== userId && !isSystemAdmin) {
      throw new UnauthorizedError('পোস্টটির স্থিতি পরিবর্তন করার অনুমতি আপনার নেই');
    }

    const nextStatus = targetStatus || (post.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT');

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { status: nextStatus },
      select: { id: true, status: true },
    });

    return updated;
  }

  public async toggleLike(
    postId: string,
    userId: string,
    reactionType: ReactionType = 'LIKE',
  ): Promise<{
    liked: boolean;
    userReaction: ReactionType | null;
    likesCount: number;
    topReactions: ReactionType[];
    recentLikers: string[];
  }> {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('পোস্ট পাওয়া যায়নি');

    const validTypes: ReactionType[] = ['LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];
    const selectedType = validTypes.includes(reactionType) ? reactionType : 'LIKE';

    const existing = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let liked = false;
    let userReaction: ReactionType | null = null;

    if (existing) {
      if (existing.type === selectedType) {
        // Same reaction clicked again -> remove it (unlike)
        await this.prisma.postLike.delete({
          where: { id: existing.id },
        });
        liked = false;
        userReaction = null;
      } else {
        // Different reaction clicked -> update reaction type
        await this.prisma.postLike.update({
          where: { id: existing.id },
          data: { type: selectedType },
        });
        liked = true;
        userReaction = selectedType;
      }
    } else {
      // New reaction
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
          type: selectedType,
        },
      });
      liked = true;
      userReaction = selectedType;

      // Notify post author if not self
      if (post.authorId !== userId) {
        await this.prisma.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: userId,
            type: 'POST_LIKE',
            title: 'নতুন প্রতিক্রিয়া',
            content: 'আপনার পোস্টে একটি নতুন রিঅ্যাকশন পড়েছে।',
            entityId: postId,
            entityType: 'post',
          },
        });
      }
    }

    const [likesCount, allLikes] = await Promise.all([
      this.prisma.postLike.count({ where: { postId } }),
      this.prisma.postLike.findMany({
        where: { postId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          type: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    const topReactions = Array.from(new Set(allLikes.map((l) => l.type as ReactionType)));
    const recentLikers = allLikes.map((l) => l.user.name);

    return {
      liked,
      userReaction,
      likesCount,
      topReactions,
      recentLikers,
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
          select: AUTHOR_SELECT,
        },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt,
      author: this.mapAuthor(c.author),
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
          select: AUTHOR_SELECT,
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
      author: this.mapAuthor(comment.author),
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
          select: AUTHOR_SELECT,
        },
      },
    });

    return stories.map((s) => ({
      id: s.id,
      title: s.title,
      mediaUrl: s.mediaUrl,
      author: this.mapAuthor(s.author),
      createdAt: s.createdAt,
    }));
  }

  public async createStory(
    input: { title?: string; mediaUrl: string },
    authorId: string,
  ): Promise<StoryDto> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = await this.prisma.story.create({
      data: {
        title: input.title || 'মোহাম্মদপুরী স্টোরি',
        mediaUrl: input.mediaUrl,
        expiresAt,
        authorId,
      },
      include: {
        author: {
          select: AUTHOR_SELECT,
        },
      },
    });

    return {
      id: story.id,
      title: story.title,
      mediaUrl: story.mediaUrl,
      author: this.mapAuthor(story.author),
      createdAt: story.createdAt,
    };
  }
}
