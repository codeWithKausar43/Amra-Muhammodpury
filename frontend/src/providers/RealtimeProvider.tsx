'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeClient, RealtimeClient } from '@/lib/realtime/websocket-client';
import { notificationAudio } from '@/lib/audio/notificationSound';

interface RealtimeContextType {
  client: RealtimeClient;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  subscribeToCampaign: (campaignId: string) => () => void;
}

const RealtimeContext = React.createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>(realtimeClient.status);

  React.useEffect(() => {
    // 1. Listen to status
    const unbindStatus = realtimeClient.onStatusChange(setStatus);

    // 2. Connect client
    realtimeClient.connect();

    // 3. Register real-time event handlers
    const unbindCampaignProgress = realtimeClient.on('CAMPAIGN_PROGRESS_UPDATED', (payload: any) => {
      if (!payload || !payload.campaignId) return;

      // Optimistically patch single campaign cache by ID
      queryClient.setQueryData(['campaign', payload.campaignId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          collectedAmount: payload.collectedAmount,
          goalAmount: payload.goalAmount !== undefined ? payload.goalAmount : old.goalAmount,
          progressPercentage: payload.progressPercentage,
          remainingAmount: payload.remainingAmount !== undefined ? payload.remainingAmount : old.remainingAmount,
          status: payload.status || old.status,
        };
      });

      // Optimistically patch single campaign cache by slug if present
      if (payload.slug) {
        queryClient.setQueryData(['campaign', payload.slug], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            collectedAmount: payload.collectedAmount,
            goalAmount: payload.goalAmount !== undefined ? payload.goalAmount : old.goalAmount,
            progressPercentage: payload.progressPercentage,
            remainingAmount: payload.remainingAmount !== undefined ? payload.remainingAmount : old.remainingAmount,
            status: payload.status || old.status,
          };
        });
      }

      // Optimistically patch public campaign list caches
      queryClient.setQueriesData({ queryKey: ['campaigns'] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old;
        return {
          ...old,
          items: old.items.map((camp: any) => {
            if (camp.id === payload.campaignId) {
              return {
                ...camp,
                collectedAmount: payload.collectedAmount,
                goalAmount: payload.goalAmount !== undefined ? payload.goalAmount : camp.goalAmount,
                progressPercentage: payload.progressPercentage,
                remainingAmount: payload.remainingAmount !== undefined ? payload.remainingAmount : camp.remainingAmount,
                status: payload.status || camp.status,
              };
            }
            return camp;
          }),
        };
      });

      // Invalidate admin overview in background
      queryClient.invalidateQueries({ queryKey: ['campaign-overview'], exact: false });
    });

    const unbindDonationSubmitted = realtimeClient.on('CAMPAIGN_DONATION_SUBMITTED', () => {
      // Refresh admin pending donations and overview counts immediately
      queryClient.invalidateQueries({ queryKey: ['campaign-donations'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-overview'] });
    });

    const unbindDonationReviewed = realtimeClient.on('CAMPAIGN_DONATION_VERIFIED', () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-donations'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-overview'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    });

    const unbindDonationRejected = realtimeClient.on('CAMPAIGN_DONATION_REJECTED', () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-donations'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-overview'] });
    });

    const unbindNotificationReceived = realtimeClient.on('NOTIFICATION_RECEIVED', (_data: any) => {
      // Invalidate notifications query
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });

      // Play soft alert chime
      try {
        notificationAudio?.play?.();
      } catch {
        // Audio playback was prevented or not loaded
      }
    });

    const unbindNotificationRead = realtimeClient.on('NOTIFICATION_READ', (data: any) => {
      if (typeof data?.unreadCount === 'number') {
        queryClient.setQueryData(['unread-notifications-count'], data.unreadCount);
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    const unbindOrgPayment = realtimeClient.on('ORG_PAYMENT_VERIFIED', () => {
      queryClient.invalidateQueries({ queryKey: ['contribution-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['org-admin-stats'] });
    });

    const unbindOrgApplication = realtimeClient.on('ORG_APPLICATION_SUBMITTED', () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['org-admin-stats'] });
    });

    const unbindOrgNotice = realtimeClient.on('ORG_NOTICE_PUBLISHED', () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    });

    return () => {
      unbindStatus();
      unbindCampaignProgress();
      unbindDonationSubmitted();
      unbindDonationReviewed();
      unbindDonationRejected();
      unbindNotificationReceived();
      unbindNotificationRead();
      unbindOrgPayment();
      unbindOrgApplication();
      unbindOrgNotice();
    };
  }, [queryClient]);

  const subscribeToCampaign = React.useCallback((campaignId: string) => {
    const channel = `campaign:${campaignId}`;
    realtimeClient.subscribe(channel);
    return () => {
      realtimeClient.unsubscribe(channel);
    };
  }, []);

  const value = React.useMemo(
    () => ({
      client: realtimeClient,
      status,
      subscribeToCampaign,
    }),
    [status, subscribeToCampaign],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = React.useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
