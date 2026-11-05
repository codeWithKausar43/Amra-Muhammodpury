'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RealtimeProvider } from './RealtimeProvider';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // App-like performance: cached data stays valid for 1 min
        staleTime: 60 * 1000,
        // Preserve unmounted queries in memory for 10 mins during tab switching
        gcTime: 10 * 60 * 1000,
        // Prevent jarring screen refetch flicker when switching between mobile apps
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: reuse the client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>{children}</RealtimeProvider>
    </QueryClientProvider>
  );
}
