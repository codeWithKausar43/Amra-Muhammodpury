export type RealtimeChannel =
  | 'public'
  | `campaign:${string}`
  | `user:${string}`
  | 'admin';

export type RealtimeEventType =
  // Public Campaign Events
  | 'CAMPAIGN_PROGRESS_UPDATED'
  // Admin Campaign Events
  | 'CAMPAIGN_DONATION_SUBMITTED'
  | 'CAMPAIGN_DONATION_VERIFIED'
  | 'CAMPAIGN_DONATION_REJECTED'
  | 'CAMPAIGN_STATUS_CHANGED'
  // User Notifications
  | 'NOTIFICATION_RECEIVED'
  | 'NOTIFICATION_READ'
  // Organization Events
  | 'ORG_APPLICATION_SUBMITTED'
  | 'ORG_APPLICATION_REVIEWED'
  | 'ORG_PAYMENT_SUBMITTED'
  | 'ORG_PAYMENT_VERIFIED'
  | 'ORG_NOTICE_PUBLISHED';

export interface CampaignProgressUpdatedPayload {
  campaignId: string;
  slug?: string | null;
  collectedAmount: number;
  goalAmount?: number | null;
  progressPercentage: number;
  remainingAmount?: number | null;
  status: string;
  updatedAt: string;
}

export interface CampaignDonationSubmittedPayload {
  campaignId: string;
  campaignTitle: string;
  donationId: string;
  donorName: string;
  donorPhone: string;
  amount: number;
  paymentMethod: string;
  trxId?: string | null;
  receiptNumber?: string | null;
  status: 'PENDING';
  submittedAt: string;
}

export interface CampaignDonationReviewedPayload {
  campaignId: string;
  donationId: string;
  status: 'VERIFIED' | 'REJECTED';
  amount: number;
  rejectionReason?: string | null;
  reviewedAt: string;
}

export interface RealtimeEnvelope<T = unknown> {
  eventId: string;
  channel: RealtimeChannel;
  event: RealtimeEventType;
  data: T;
  timestamp: number;
}

export type ClientInboundMessage =
  | { type: 'PING' }
  | { type: 'SUBSCRIBE'; channel: RealtimeChannel }
  | { type: 'UNSUBSCRIBE'; channel: RealtimeChannel };

export interface ConnectedClient {
  id: string;
  ws: any;
  userId?: string | null;
  role?: string | null;
  isAdminOrOfficer: boolean;
  subscriptions: Set<string>;
  isAlive: boolean;
  connectedAt: Date;
}

