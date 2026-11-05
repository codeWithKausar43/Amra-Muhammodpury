import { randomUUID } from 'node:crypto';
import type {
  ConnectedClient,
  RealtimeChannel,
  RealtimeEventType,
  RealtimeEnvelope,
  CampaignProgressUpdatedPayload,
  CampaignDonationSubmittedPayload,
  CampaignDonationReviewedPayload,
} from './realtime.types.js';

export class RealtimeService {
  private static instance: RealtimeService;

  // client.id -> ConnectedClient
  private clients = new Map<string, ConnectedClient>();

  // channel -> Set of ConnectedClient
  private channelMap = new Map<string, Set<ConnectedClient>>();

  // userId -> Set of ConnectedClient
  private userMap = new Map<string, Set<ConnectedClient>>();

  private heartbeatTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startHeartbeat();
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Register a newly upgraded WebSocket connection
   */
  public registerClient(
    ws: any,
    info: {
      userId?: string | null;
      role?: string | null;
      isAdminOrOfficer: boolean;
    },
  ): ConnectedClient {
    const clientId = randomUUID();
    const client: ConnectedClient = {
      id: clientId,
      ws,
      userId: info.userId || null,
      role: info.role || null,
      isAdminOrOfficer: info.isAdminOrOfficer,
      subscriptions: new Set<string>(),
      isAlive: true,
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);

    // Auto-subscribe to 'public' channel
    this.subscribe(client, 'public');

    // If authenticated, subscribe to user-specific private channel
    if (client.userId) {
      this.subscribe(client, `user:${client.userId}` as RealtimeChannel);

      if (!this.userMap.has(client.userId)) {
        this.userMap.set(client.userId, new Set());
      }
      this.userMap.get(client.userId)!.add(client);
    }

    // If authorized admin or officer, auto-subscribe to 'admin' channel
    if (client.isAdminOrOfficer) {
      this.subscribe(client, 'admin');
    }

    // Ping / Pong handlers
    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('close', () => {
      this.removeClient(client);
    });

    ws.on('error', () => {
      this.removeClient(client);
    });

    return client;
  }

  /**
   * Remove client and clean up channel mappings
   */
  public removeClient(client: ConnectedClient) {
    this.clients.delete(client.id);

    // Remove from channels
    for (const channel of client.subscriptions) {
      const subscribers = this.channelMap.get(channel);
      if (subscribers) {
        subscribers.delete(client);
        if (subscribers.size === 0) {
          this.channelMap.delete(channel);
        }
      }
    }
    client.subscriptions.clear();

    // Remove from user index
    if (client.userId && this.userMap.has(client.userId)) {
      const userSockets = this.userMap.get(client.userId)!;
      userSockets.delete(client);
      if (userSockets.size === 0) {
        this.userMap.delete(client.userId);
      }
    }

    try {
      if (client.ws.readyState === 1 || client.ws.readyState === 0) {
        client.ws.terminate();
      }
    } catch {
      // Ignore cleanup error
    }
  }

  /**
   * Subscribe client to a channel with role/permission validation
   */
  public subscribe(client: ConnectedClient, channel: string): boolean {
    // Permission checks
    if (channel === 'admin' && !client.isAdminOrOfficer) {
      return false; // Unauthorized
    }

    if (channel.startsWith('user:')) {
      const targetUserId = channel.replace('user:', '');
      if (client.userId !== targetUserId && !client.isAdminOrOfficer) {
        return false; // Unauthorized
      }
    }

    client.subscriptions.add(channel);

    if (!this.channelMap.has(channel)) {
      this.channelMap.set(channel, new Set());
    }
    this.channelMap.get(channel)!.add(client);

    return true;
  }

  /**
   * Unsubscribe client from channel
   */
  public unsubscribe(client: ConnectedClient, channel: string) {
    client.subscriptions.delete(channel);
    const subscribers = this.channelMap.get(channel);
    if (subscribers) {
      subscribers.delete(client);
      if (subscribers.size === 0) {
        this.channelMap.delete(channel);
      }
    }
  }

  /**
   * Broadcast typed event to a channel
   */
  public publish<T = unknown>(
    channel: RealtimeChannel | string,
    event: RealtimeEventType,
    data: T,
  ): number {
    const subscribers = this.channelMap.get(channel);
    if (!subscribers || subscribers.size === 0) {
      return 0;
    }

    const envelope: RealtimeEnvelope<T> = {
      eventId: randomUUID(),
      channel: channel as RealtimeChannel,
      event,
      data,
      timestamp: Date.now(),
    };

    const message = JSON.stringify(envelope);
    let deliveredCount = 0;

    for (const client of subscribers) {
      try {
        if (client.ws.readyState === 1) {
          // OPEN
          client.ws.send(message);
          deliveredCount++;
        } else if (client.ws.readyState >= 2) {
          // CLOSING or CLOSED
          this.removeClient(client);
        }
      } catch {
        this.removeClient(client);
      }
    }

    return deliveredCount;
  }

  // --------------------------------------------------------------------------
  // Public Campaign Real-Time Publishers
  // --------------------------------------------------------------------------

  /**
   * Broadcast public campaign progress update.
   * STRICT PRIVACY: NEVER includes donor identity, phone, or Trx ID.
   */
  public publishCampaignProgress(payload: CampaignProgressUpdatedPayload) {
    // 1. Broadcast to general public channel (for /campaigns listing cards)
    this.publish('public', 'CAMPAIGN_PROGRESS_UPDATED', payload);

    // 2. Broadcast to specific campaign channel (for /campaigns/[id] details page)
    this.publish(`campaign:${payload.campaignId}`, 'CAMPAIGN_PROGRESS_UPDATED', payload);
  }

  /**
   * Broadcast new pending donation to admin channel immediately
   */
  public publishCampaignDonationSubmitted(payload: CampaignDonationSubmittedPayload) {
    this.publish('admin', 'CAMPAIGN_DONATION_SUBMITTED', payload);
  }

  /**
   * Broadcast donation verification / rejection to admin channel
   */
  public publishCampaignDonationReviewed(payload: CampaignDonationReviewedPayload) {
    if (payload.status === 'VERIFIED') {
      this.publish('admin', 'CAMPAIGN_DONATION_VERIFIED', payload);
    } else {
      this.publish('admin', 'CAMPAIGN_DONATION_REJECTED', payload);
    }
  }

  // --------------------------------------------------------------------------
  // User & Organization Publishers
  // --------------------------------------------------------------------------

  /**
   * Broadcast personal notification to target user
   */
  public publishNotification(userId: string, notification: any) {
    this.publish(`user:${userId}`, 'NOTIFICATION_RECEIVED', notification);
  }

  /**
   * Broadcast notification read status across user's connected devices
   */
  public publishNotificationRead(userId: string, data: { notificationId?: string; unreadCount: number }) {
    this.publish(`user:${userId}`, 'NOTIFICATION_READ', data);
  }

  /**
   * Broadcast admin-level events
   */
  public publishToAdmins(event: RealtimeEventType, data: any) {
    this.publish('admin', event, data);
  }

  /**
   * Broadcast to user-specific private channel
   */
  public publishToUser(userId: string, event: RealtimeEventType, data: any) {
    this.publish(`user:${userId}`, event, data);
  }

  /**
   * Broadcast to public channel
   */
  public publishToPublic(event: RealtimeEventType, data: any) {
    this.publish('public', event, data);
  }

  /**
   * 30-second heartbeat to detect and purge dead connections
   */
  private startHeartbeat() {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      for (const [, client] of this.clients) {
        if (!client.isAlive) {
          this.removeClient(client);
          continue;
        }

        client.isAlive = false;
        try {
          if (client.ws.readyState === 1) {
            client.ws.ping();
          } else {
            this.removeClient(client);
          }
        } catch {
          this.removeClient(client);
        }
      }
    }, 30000);

    // Prevent timer from keeping the process alive
    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  /**
   * Get active connection stats for diagnostics
   */
  public getStats() {
    return {
      totalClients: this.clients.size,
      totalChannels: this.channelMap.size,
      activeUsers: this.userMap.size,
    };
  }
}

export const realtimeService = RealtimeService.getInstance();

