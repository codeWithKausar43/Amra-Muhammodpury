import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { Post, Comment, Story, CreatePostPayload, ReactionType } from '../types';

export const fallbackMockStories: Story[] = [
  {
    id: 'story-emrul',
    title: 'EN Emrul Chowdhury',
    mediaUrl:
      'https://res.cloudinary.com/rim6yblt/image/upload/v1794368838/amra-muhammadpuri/profiles/vkokllnin7vnikzfdcp1.jpg',
    author: {
      id: '8MbbtE4faC2xRVDRbMFkKHMWnnqkVV9E',
      name: 'EN Emrul Chowdhury',
      image:
        'https://res.cloudinary.com/rim6yblt/image/upload/v1794368838/amra-muhammadpuri/profiles/vkokllnin7vnikzfdcp1.jpg',
      role: 'USER',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story-kausar-ahammed',
    title: 'Kausar Ahammed',
    mediaUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    author: {
      id: 'k07XjrZCXv8SoR1eUjMrhAubA9EX9rRF',
      name: 'Kausar Ahammed',
      image:
        'https://lh3.googleusercontent.com/a/ACg8ocID0L8Ifl4dlp2shk7t3yWH88CJy-rArDjUqDYfj3Xl1g1OXt67=s96-c',
      role: 'USER',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story-md-kausar',
    title: 'Md Kausar',
    mediaUrl:
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&auto=format&fit=crop&q=80',
    author: {
      id: 'GmjKUrDCXPKJ1X69B6U0eWTNIsFWXf7c',
      name: 'Md Kausar',
      image:
        'https://lh3.googleusercontent.com/a/ACg8ocIgqga7zhPfwELQ10ThkIUGSLTPvV_EgKnT-eyYRHt96O2XZx0=s96-c',
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

      if (res.data) {
        return {
          posts: res.data,
          total: res.meta?.total ?? res.data.length,
          totalPages: res.meta?.totalPages ?? 1,
        };
      }
    } catch (err) {
      console.error('Error fetching feed posts from database:', err);
    }

    return {
      posts: [],
      total: 0,
      totalPages: 1,
    };
  },

  async getStories(): Promise<Story[]> {
    try {
      const res = await apiClient<ApiResponse<Story[]>>('/feed/stories');
      if (res.data && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.error('Error fetching stories from database:', err);
    }
    return fallbackMockStories;
  },

  async createStory(payload: { title?: string; mediaUrl: string }): Promise<Story> {
    const res = await apiClient<ApiResponse<Story>>('/feed/stories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.data) throw new Error('স্টোরি প্রকাশ করতে ব্যর্থ হয়েছে');
    return res.data;
  },

  async createPost(payload: CreatePostPayload): Promise<Post> {
    const res = await apiClient<ApiResponse<Post>>('/feed/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.data) throw new Error('Post creation failed');
    return res.data;
  },

  async toggleLike(
    postId: string,
    reactionType?: ReactionType,
  ): Promise<{
    liked: boolean;
    userReaction: ReactionType | null;
    likesCount: number;
    topReactions: ReactionType[];
    recentLikers: string[];
  }> {
    const res = await apiClient<
      ApiResponse<{
        liked: boolean;
        userReaction: ReactionType | null;
        likesCount: number;
        topReactions: ReactionType[];
        recentLikers: string[];
      }>
    >(`/feed/posts/${postId}/like`, {
      method: 'POST',
      body: reactionType ? JSON.stringify({ type: reactionType }) : undefined,
    });
    if (!res.data) throw new Error('Like toggle failed');
    return res.data;
  },

  async getComments(postId: string): Promise<Comment[]> {
    const res = await apiClient<ApiResponse<Comment[]>>(`/feed/posts/${postId}/comments`);
    return res.data || [];
  },

  async createComment(postId: string, content: string, parentId?: string): Promise<Comment> {
    const res = await apiClient<ApiResponse<Comment>>(`/feed/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    });
    if (!res.data) throw new Error('Comment failed');
    return res.data;
  },

  async deletePost(postId: string): Promise<void> {
    await apiClient(`/feed/posts/${postId}`, {
      method: 'DELETE',
    });
  },

  async togglePostDraft(postId: string, status?: 'PUBLISHED' | 'DRAFT'): Promise<{ id: string; status: string }> {
    const res = await apiClient<ApiResponse<{ id: string; status: string }>>(`/feed/posts/${postId}/draft`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data!;
  },
};
