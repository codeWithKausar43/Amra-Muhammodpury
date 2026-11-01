import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { Post, Comment, Story, CreatePostPayload } from '../types';

export const fallbackMockPosts: Post[] = [
  {
    id: 'sample-post-1',
    content:
      'তাজমহল রোডের নতুন ফুটপাত সংস্কার কাজ দ্রুত গতিতে এগিয়ে চলেছে। স্থানীয় বাসিন্দাদের জন্য হাঁটাচলা এখন অনেক বেশি নিরাপদ ও আরামদায়ক। গাছগুলোর সুরক্ষা নিশ্চিত করে কাজ পরিচালনা প্রশংসনীয়। #মুহাম্মদপুর_উন্নয়ন #নাগরিক_উদ্যোগ #তাজমহল_রোড',
    location: 'তাজমহল রোড এলাকা',
    category: 'GENERAL',
    blockBadge: 'ব্লক-সি',
    likesCount: 155,
    commentsCount: 32,
    sharesCount: 12,
    hasLiked: false,
    isEmergency: false,
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    author: {
      id: 'author-1',
      name: 'ইঞ্জি. সামিউল ইসলাম',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'USER',
    },
    media: [
      {
        id: 'media-1',
        publicId: 'muhammadpur/tajmahal-rd',
        secureUrl:
          'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000&auto=format&fit=crop&q=80',
        resourceType: 'image',
        format: 'jpg',
      },
    ],
    recentComments: [
      {
        id: 'c-1',
        content:
          'খুব সুন্দর উদ্যোগ! বর্ষার আগে ড্রেনেজ পাইপগুলোর সংযোগ ঠিকঠাক হয়েছে কিনা তাও দেখা প্রয়োজন।',
        createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        author: {
          id: 'u-2',
          name: 'নদিরা বেগম',
          image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          role: 'USER',
        },
      },
    ],
  },
  {
    id: 'sample-post-2',
    content:
      'ঐতিহ্যবাহী বোবা বিরিয়ানি ও সলিমুল্লাহ রোডের সকালের চা-আড্ডা। মোহাম্মদপুরের এই সকালের আমেজ ও মেহমানদারী ঢাকার অন্য কোথাও মিলবে না! আজ সকালে কার কার সাথে দেখা হচ্ছে? ☕ #মুহাম্মদপুর_ঐতিহ্য #বোবা_বিরিয়ানি #সকালের_আড্ডা',
    location: 'সলিমুল্লাহ রোড',
    category: 'MY_BLOCK',
    blockBadge: 'সলিমুল্লাহ রোড',
    likesCount: 283,
    commentsCount: 53,
    sharesCount: 19,
    hasLiked: false,
    isEmergency: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    author: {
      id: 'author-2',
      name: 'সালমান ফারসি',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'USER',
    },
    media: [],
    recentComments: [
      {
        id: 'c-2',
        content: 'সকালের মালাই চায়ের কাপ হাতে নিয়ে আড্ডা মিস করি সবসময়! একটু পরেই আসছি।',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        author: {
          id: 'u-3',
          name: 'রেজাউল করিম',
          image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          role: 'USER',
        },
      },
    ],
  },
  {
    id: 'sample-post-3',
    content:
      'জরুরী রক্ষণাবেক্ষণ বিজ্ঞপ্তি: আগামী শনিবার বাবর রোড ও হুমায়ুন রোডে নিয়মিত ডিপিডিসি বিদ্যুৎ সাব-স্টেশন সংস্কার কাজ চলবে সকাল ৮:০০টা থেকে দুপুর ১২:০০টা পর্যন্ত। বিকল্প বিদ্যুৎ ব্যাকআপ প্রস্তুত রাখার অনুরোধ করা হচ্ছে।',
    location: 'বাবর রোড ও হুমায়ুন রোড',
    category: 'EMERGENCY',
    blockBadge: 'জরুরী',
    likesCount: 94,
    commentsCount: 14,
    sharesCount: 38,
    hasLiked: false,
    isEmergency: true,
    emergencyData: {
      department: 'ডিপিডিসি (বিদ্যুৎ বিভাগ)',
      hotline: '১৬১১০',
      badgeText: 'পরিসেবা বিজ্ঞপ্তি',
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    author: {
      id: 'author-3',
      name: 'মুহাম্মদপুর সেন্ট্রাল হেল্পডেস্ক',
      image: null,
      role: 'ADMIN',
    },
    media: [],
    recentComments: [],
  },
];

export const fallbackMockStories: Story[] = [
  {
    id: 'story-1',
    title: 'আপনার স্টোরি',
    author: { id: 'me', name: 'আপনার স্টোরি', role: 'USER' },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story-2',
    title: 'রাসেল করিম',
    author: {
      id: 's-2',
      name: 'রাসেল করিম',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      role: 'USER',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story-3',
    title: 'তানিয়া আহমেদ',
    author: {
      id: 's-3',
      name: 'তানিয়া আহমেদ',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'USER',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story-4',
    title: 'বইমেলা টিম',
    author: {
      id: 's-4',
      name: 'বইমেলা টিম',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150&auto=format&fit=crop&q=80',
      role: 'USER',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story-5',
    title: 'মেয়াদ ট্রাস্টি',
    author: {
      id: 's-5',
      name: 'মেয়াদ ট্রাস্টি',
      image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      role: 'USER',
    },
    createdAt: new Date().toISOString(),
  },
];

export const feedService = {
  async getPosts(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  } = {}): Promise<{ posts: Post[]; total: number; totalPages: number }> {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.category && params.category !== 'ALL') searchParams.set('category', params.category);
      if (params.search) searchParams.set('search', params.search);

      const res = await apiClient<ApiResponse<Post[]>>(`/feed?${searchParams.toString()}`);

      if (res.data && res.data.length > 0) {
        return {
          posts: res.data,
          total: res.meta?.total || res.data.length,
          totalPages: res.meta?.totalPages || 1,
        };
      }
    } catch {
      // Fallback gracefully to high-quality sample posts
    }

    let filtered = [...fallbackMockPosts];
    if (params.category && params.category !== 'ALL') {
      if (params.category === 'EMERGENCY') {
        filtered = filtered.filter((p) => p.isEmergency);
      } else if (params.category === 'MY_BLOCK') {
        filtered = filtered.filter((p) => p.blockBadge);
      }
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          (p.location && p.location.toLowerCase().includes(q)),
      );
    }

    return {
      posts: filtered,
      total: filtered.length,
      totalPages: 1,
    };
  },

  async getStories(): Promise<Story[]> {
    try {
      const res = await apiClient<ApiResponse<Story[]>>('/feed/stories');
      if (res.data && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return fallbackMockStories;
  },

  async createPost(payload: CreatePostPayload): Promise<Post> {
    const res = await apiClient<ApiResponse<Post>>('/feed/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.data) throw new Error('Post creation failed');
    return res.data;
  },

  async toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await apiClient<ApiResponse<{ liked: boolean; likesCount: number }>>(
      `/feed/posts/${postId}/like`,
      { method: 'POST' },
    );
    if (!res.data) throw new Error('Like toggle failed');
    return res.data;
  },

  async getComments(postId: string): Promise<Comment[]> {
    const res = await apiClient<ApiResponse<Comment[]>>(`/feed/posts/${postId}/comments`);
    return res.data || [];
  },

  async createComment(postId: string, content: string): Promise<Comment> {
    const res = await apiClient<ApiResponse<Comment>>(`/feed/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    if (!res.data) throw new Error('Comment failed');
    return res.data;
  },

  async deletePost(postId: string): Promise<void> {
    await apiClient(`/feed/posts/${postId}`, {
      method: 'DELETE',
    });
  },
};
