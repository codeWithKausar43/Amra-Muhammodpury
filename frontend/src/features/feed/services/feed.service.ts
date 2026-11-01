import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { Post, Comment, Story, CreatePostPayload, ReactionType } from '../types';

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
      if (res.data) {
        return res.data;
      }
    } catch (err) {
      console.error('Error fetching stories from database:', err);
    }
    return [];
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
};
