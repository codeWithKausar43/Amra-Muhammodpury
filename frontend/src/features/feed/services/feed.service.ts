import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';
import { Post, Comment, Story, CreatePostPayload, ReactionType } from '../types';

export const fallbackMockStories: Story[] = [
  {
    id: 'story-kausar-prodhan',
    title: 'Md Kausar Prodhan',
    mediaUrl:
      'https://res.cloudinary.com/rim6yblt/image/upload/v1794391060/amra-muhammadpuri/posts/znlxbzcpgkmuk331pj0f.png',
    author: {
      id: 'cJnYPIjIBrjQdd1JoR1rSVBOtK4DQHFu',
      name: 'Md Kausar Prodhan',
      image:
        'https://lh3.googleusercontent.com/a/ACg8ocK4Xnzx48E0sVsTBEyJUE2X1UyiWSSzK3fhEjqNQXLrQOTCf4Y=s96-c',
      role: 'SUPER_ADMIN',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'story-hafizur',
    title: 'MD Hafizur',
    mediaUrl:
      'https://res.cloudinary.com/rim6yblt/image/upload/v1794393198/amra-muhammadpuri/profiles/tjq5ggw9n47jonadnjn0.webp',
    author: {
      id: 'vIf5fxONL80LMjOcJD8eqDTWv3hobr2v',
      name: 'MD Hafizur',
      image:
        'https://res.cloudinary.com/rim6yblt/image/upload/v1794393198/amra-muhammadpuri/profiles/tjq5ggw9n47jonadnjn0.webp',
      role: 'USER',
    },
    createdAt: new Date().toISOString(),
  },
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
