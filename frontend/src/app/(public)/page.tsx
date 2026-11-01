'use client';

import * as React from 'react';
import { useSession } from '@/lib/auth/auth-client';
import {
  StoriesCarousel,
  PostComposer,
  FilterTabs,
  PostCard,
  EmergencyNoticeCard,
  LeftSidebar,
  RightSidebar,
  CreatePostModal,
  AuthPromptModal,
  StoryViewerModal,
} from '@/features/feed/components';
import { FeedCategory } from '@/features/feed/components/FilterTabs';
import { Post } from '@/features/feed/types';
import { useFeedModal } from '@/features/feed/context/FeedModalContext';
import { Loader2, Sprout } from 'lucide-react';
import {
  useFeedPostsQuery,
  useFeedStoriesQuery,
  usePrefetchSocialTabs,
} from '@/features/social/hooks/useSocialQueries';
import { useQueryClient } from '@tanstack/react-query';

export default function HomePage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const {
    isCreatePostOpen,
    openCreatePost,
    closeCreatePost,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    searchQuery,
  } = useFeedModal();

  const [category, setCategory] = React.useState<FeedCategory>('ALL');
  const [selectedBlock, setSelectedBlock] = React.useState<string | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = React.useState<number | null>(null);

  // 1. Intelligent Cached Queries
  const { data: posts = [], isLoading: isPostsLoading } = useFeedPostsQuery(category);
  const { data: stories = [] } = useFeedStoriesQuery();

  // 2. Background Tab Prefetcher (runs when Home is rendered & idle)
  usePrefetchSocialTabs();

  // Handle post creation callback (instantly updates TanStack cache)
  const handlePostCreated = (newPost: Post) => {
    queryClient.setQueriesData<Post[]>(
      { queryKey: ['feed', 'posts'] },
      (old) => (old ? [newPost, ...old] : [newPost]),
    );
  };

  // Handle post deletion callback (instantly updates TanStack cache)
  const handlePostDeleted = (postId: string) => {
    queryClient.setQueriesData<Post[]>(
      { queryKey: ['feed', 'posts'] },
      (old) => (old ? old.filter((p) => p.id !== postId) : []),
    );
  };

  // Filter posts by selected block and navbar search query
  const filteredPosts = React.useMemo(() => {
    let result = posts;
    if (selectedBlock) {
      result = result.filter(
        (p) =>
          p.blockBadge?.includes(selectedBlock) ||
          p.location?.includes(selectedBlock) ||
          p.content.includes(selectedBlock),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          (p.location && p.location.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [posts, selectedBlock, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-5">
      <div className="flex items-start justify-center lg:justify-between gap-5 xl:gap-6">
        {/* Left Column (Desktop Navigation & Block Directory) */}
        <LeftSidebar
          activeBlock={selectedBlock}
          onSelectBlock={setSelectedBlock}
        />

        {/* Center Column: Social Timeline Feed (Facebook Style) */}
        <div className="w-full max-w-xl xl:max-w-2xl min-w-0 space-y-3.5 sm:space-y-4">
          {/* 1. Post Composer Row (Avatar with green dot + What's on your mind? + Photo icon) */}
          <PostComposer
            user={session?.user}
            onPostCreated={handlePostCreated}
            onRequireAuth={openAuthModal}
            onOpenModal={openCreatePost}
          />

          {/* 2. Stories Carousel (Vertical Facebook Story Cards) */}
          <StoriesCarousel
            stories={stories}
            userImage={session?.user?.image}
            onAddStory={() => {
              if (!session?.user) openAuthModal();
              else alert('স্টোরি আপলোড ফিচার শীঘ্রই উন্মুক্ত করা হবে!');
            }}
            onSelectStory={(index) => setActiveStoryIndex(index)}
          />

          {/* 3. Category Filter Tabs */}
          <FilterTabs
            activeCategory={category}
            onSelectCategory={(cat) => {
              setCategory(cat);
              setSelectedBlock(null);
            }}
          />

          {/* Active Block Filter Indicator */}
          {selectedBlock && (
            <div className="flex items-center justify-between bg-brand-mint/30 dark:bg-brand-emerald/15 border border-brand-emerald/20 px-3.5 py-2 rounded-xl text-xs">
              <span className="text-slate-800 dark:text-slate-200">
                ফিল্টার করা হয়েছে: <strong className="font-bold text-brand-emerald">{selectedBlock}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedBlock(null)}
                className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
              >
                মুছে ফেলুন
              </button>
            </div>
          )}

          {/* 4. Feed Posts List */}
          {isPostsLoading && posts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
              <span className="text-xs font-medium">মুহাম্মদপুরের পোস্টসমূহ লোড হচ্ছে...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-brand-charcoal-dark rounded-2xl p-8 border border-slate-200/80 dark:border-white/10 text-center space-y-2">
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                এই ক্যাটাগরিতে এখনো কোনো পোস্ট নেই
              </p>
              <p className="text-xs text-slate-500">
                মুহাম্মদপুরের প্রথম আপডেটটি আপনি নিজেই শেয়ার করুন!
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 sm:space-y-4">
              {filteredPosts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <PostCard
                    post={post}
                    currentUserId={session?.user?.id}
                    onPostDeleted={handlePostDeleted}
                    onRequireAuth={openAuthModal}
                  />

                  {/* Insert Emergency Notice Card after the 2nd post or when viewing EMERGENCY tab */}
                  {(index === 1 || category === 'EMERGENCY') && (
                    <EmergencyNoticeCard />
                  )}
                </React.Fragment>
              ))}

              {/* End of Feed Landmark */}
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 select-none">
                <div className="w-10 h-10 rounded-full bg-brand-emerald/10 dark:bg-brand-emerald/20 text-brand-emerald flex items-center justify-center">
                  <Sprout className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    সব খবর পড়া শেষ!
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    মুহাম্মদপুরের সম্প্রীতি ও পরিচ্ছন্নতা আমাদের অহংকার।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Emergency Helpline & Community Directory) */}
        <RightSidebar />
      </div>

      {/* Global Modals */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={closeCreatePost}
        user={session?.user}
        onPostCreated={handlePostCreated}
      />

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />

      {/* Fullscreen Story Viewer Modal */}
      <StoryViewerModal
        isOpen={activeStoryIndex !== null}
        onClose={() => setActiveStoryIndex(null)}
        stories={stories}
        initialStoryIndex={activeStoryIndex ?? 0}
      />
    </div>
  );
}
