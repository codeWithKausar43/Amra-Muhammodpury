'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth/auth-client';
import { useActivePopupCampaignQuery } from '@/features/campaign/hooks/useCampaignQueries';
import { CampaignEntryPopup } from '@/features/campaign/components/CampaignEntryPopup';
import {
  useOrgMembershipStatusQuery,
  useOrgMemberDashboardQuery,
} from '../hooks/useOrganizationQueries';
import { MemberDueReminderPopup } from './MemberDueReminderPopup';
import { MembershipInvitationPopup } from './MembershipInvitationPopup';

export const CentralPopupManager: React.FC = () => {
  const pathname = usePathname() || '';

  // 1. Route Suppression Rules
  const isSensitiveRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/organization/payment');

  const isCampaignExperience = pathname.startsWith('/campaigns');
  const isApplicationPage = pathname.startsWith('/organization/apply');

  // 2. Authentication & Membership Queries
  const { data: session, isPending: isAuthPending } = useSession();
  const isAuthenticated = Boolean(session?.user);

  const { data: statusData, isLoading: isStatusLoading } =
    useOrgMembershipStatusQuery(isAuthenticated);

  const isActiveMember =
    Boolean(statusData?.hasMembership) && statusData?.membership?.status === 'ACTIVE';

  const { data: dashboardData, isLoading: isDashboardLoading } =
    useOrgMemberDashboardQuery(isActiveMember);

  // 3. Campaign Query
  const { data: activeCampaign, isLoading: isCampaignLoading } =
    useActivePopupCampaignQuery();

  // 4. Local Display States
  const [isCampaignOpen, setIsCampaignOpen] = React.useState(false);
  const [isDueReminderOpen, setIsDueReminderOpen] = React.useState(false);
  const [isInvitationOpen, setIsInvitationOpen] = React.useState(false);

  // 5. Check Session Storage Helpers
  const getSessionFlag = (key: string): boolean => {
    if (typeof window === 'undefined') return true;
    try {
      return sessionStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  };

  const setSessionFlag = (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, 'true');
    } catch {
      // Ignore storage errors
    }
  };

  // 6. Central Decision Logic & Scheduler
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (isSensitiveRoute) {
      setIsDueReminderOpen(false);
      setIsInvitationOpen(false);
      return undefined;
    }

    // Wait until critical data settles
    if (isCampaignLoading || isAuthPending || (isAuthenticated && isStatusLoading)) return undefined;

    // Check Campaign Status:
    // If an eligible campaign exists and has not yet been seen in this session,
    // Campaign Popup holds Priority #1.
    const campaignSeen = getSessionFlag('amp_campaign_popup_seen');
    const isCampaignEligibleAndPending = !campaignSeen && Boolean(activeCampaign);

    if (isCampaignEligibleAndPending || isCampaignOpen) {
      // Campaign has highest priority. Suppress membership popups.
      setIsDueReminderOpen(false);
      setIsInvitationOpen(false);
      return undefined;
    }

    // If user is currently inside the Campaign experience (e.g. browsing /campaigns/*),
    // suppress all membership popups until they leave.
    if (isCampaignExperience) {
      setIsDueReminderOpen(false);
      setIsInvitationOpen(false);
      return undefined;
    }

    // -------------------------------------------------------------
    // Priority #2: Member Monthly Due Reminder Popup
    // (Only for Active Members with eligible unpaid dues)
    // -------------------------------------------------------------
    if (isActiveMember) {
      if (isDashboardLoading || !dashboardData) return undefined;

      const pendingDueCount = dashboardData.pendingDueCount || 0;
      const dueSeen = getSessionFlag('amp_due_reminder_popup_seen');

      if (pendingDueCount > 0 && !dueSeen) {
        const timer = setTimeout(() => {
          setIsDueReminderOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        setIsDueReminderOpen(false);
      }

      // Active members NEVER see the Membership Invitation
      setIsInvitationOpen(false);
      return undefined;
    }

    // -------------------------------------------------------------
    // Priority #3: Organization Membership Invitation Popup
    // (Only for eligible non-members, NOT pending applicants)
    // -------------------------------------------------------------
    if (!isActiveMember) {
      // If user is on the application page itself, don't show the invite popup
      if (isApplicationPage) {
        setIsInvitationOpen(false);
        return undefined;
      }

      // Check if user has an application waiting for approval
      const isPendingApplication =
        statusData?.latestApplication?.status === 'PENDING' ||
        statusData?.membership?.status === 'APPROVED_PAYMENT_PENDING';

      if (isPendingApplication) {
        // Pending applicants use the existing status UI, never the invitation
        setIsInvitationOpen(false);
        return undefined;
      }

      const inviteSeen = getSessionFlag('amp_member_invite_popup_seen');
      if (!inviteSeen) {
        const timer = setTimeout(() => {
          setIsInvitationOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }

    return undefined;
  }, [
    pathname,
    isSensitiveRoute,
    isCampaignExperience,
    isApplicationPage,
    isCampaignLoading,
    isAuthPending,
    activeCampaign,
    isCampaignOpen,
    isActiveMember,
    isDashboardLoading,
    dashboardData,
    statusData,
  ]);

  // Handlers for closing popups
  const handleCloseDueReminder = () => {
    setIsDueReminderOpen(false);
    setSessionFlag('amp_due_reminder_popup_seen');
  };

  const handleCloseInvitation = () => {
    setIsInvitationOpen(false);
    setSessionFlag('amp_member_invite_popup_seen');
  };

  return (
    <>
      {/* 1. Existing Campaign Popup (Priority #1) */}
      <CampaignEntryPopup onVisibilityChange={setIsCampaignOpen} />

      {/* 2. Member Due Reminder Popup (Priority #2) */}
      {!isCampaignOpen && !isCampaignExperience && !isSensitiveRoute && isActiveMember && dashboardData && (
        <MemberDueReminderPopup
          isOpen={isDueReminderOpen}
          onClose={handleCloseDueReminder}
          memberName={session?.user?.name || dashboardData.membership.user?.name || 'সম্মানিত সদস্য'}
          totalDueAmount={dashboardData.totalDueAmount || (dashboardData.pendingDueCount * (dashboardData.membership.monthlyContribution || 50))}
          pendingDueCount={dashboardData.pendingDueCount}
          dueBreakdown={dashboardData.dueBreakdown || []}
          pendingReviewCount={dashboardData.pendingReviewCount || 0}
        />
      )}

      {/* 3. Membership Invitation Popup (Priority #3) */}
      {!isCampaignOpen && !isCampaignExperience && !isSensitiveRoute && !isActiveMember && (
        <MembershipInvitationPopup
          isOpen={isInvitationOpen}
          onClose={handleCloseInvitation}
        />
      )}
    </>
  );
};
