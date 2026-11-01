import { PrismaClient } from '../../config/database.js';

export class SearchService {
  constructor(private readonly prisma: PrismaClient) {}

  public async search(query: string, type: string = 'ALL', limit: number = 20) {
    const q = query.trim();
    if (!q) {
      return { people: [], posts: [], groups: [] };
    }

    const shouldSearchPeople = type === 'ALL' || type === 'PEOPLE';
    const shouldSearchPosts = type === 'ALL' || type === 'POSTS';
    const shouldSearchGroups = type === 'ALL' || type === 'GROUPS';

    const [people, posts, groups] = await Promise.all([
      shouldSearchPeople
        ? this.prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
              ],
            },
            take: limit,
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              bio: true,
            },
          })
        : [],
      shouldSearchPosts
        ? this.prisma.post.findMany({
            where: {
              isDeleted: false,
              OR: [
                { content: { contains: q, mode: 'insensitive' } },
                { location: { contains: q, mode: 'insensitive' } },
                { blockBadge: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              author: { select: { id: true, name: true, image: true, role: true } },
              media: { include: { media: true }, orderBy: { order: 'asc' } },
              _count: { select: { likes: true, comments: { where: { isDeleted: false } } } },
            },
          })
        : [],
      shouldSearchGroups
        ? this.prisma.group.findMany({
            where: {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: limit,
            include: {
              _count: { select: { members: true, posts: true } },
            },
          })
        : [],
    ]);

    const formattedPosts = posts.map((p) => ({
      id: p.id,
      content: p.content,
      location: p.location,
      category: p.category,
      blockBadge: p.blockBadge,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      sharesCount: p.sharesCount,
      createdAt: p.createdAt.toISOString(),
      author: p.author,
      media: p.media.map((m) => m.media),
    }));

    return { people, posts: formattedPosts, groups };
  }
}

