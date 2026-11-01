'use client';

import * as React from 'react';

interface FeedModalContextType {
  isCreatePostOpen: boolean;
  openCreatePost: () => void;
  closeCreatePost: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const FeedModalContext = React.createContext<FeedModalContextType | undefined>(undefined);

export function FeedModalProvider({ children }: { children: React.ReactNode }) {
  const [isCreatePostOpen, setIsCreatePostOpen] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <FeedModalContext.Provider
      value={{
        isCreatePostOpen,
        openCreatePost: () => setIsCreatePostOpen(true),
        closeCreatePost: () => setIsCreatePostOpen(false),
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </FeedModalContext.Provider>
  );
}

export function useFeedModal() {
  const context = React.useContext(FeedModalContext);
  if (!context) {
    return {
      isCreatePostOpen: false,
      openCreatePost: () => {},
      closeCreatePost: () => {},
      isAuthModalOpen: false,
      openAuthModal: () => {},
      closeAuthModal: () => {},
      searchQuery: '',
      setSearchQuery: () => {},
    };
  }
  return context;
}
