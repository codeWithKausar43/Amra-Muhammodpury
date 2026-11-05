import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimeService } from '../../src/modules/realtime/realtime.service.js';

describe('RealtimeService (WebSocket Architecture & Security)', () => {
  let service: RealtimeService;

  beforeEach(() => {
    service = RealtimeService.getInstance();
  });

  it('should register client and auto-subscribe to public channel', () => {
    const mockWs = {
      readyState: 1,
      send: vi.fn(),
      on: vi.fn(),
      ping: vi.fn(),
      terminate: vi.fn(),
    };

    const client = service.registerClient(mockWs, {
      userId: null,
      role: null,
      isAdminOrOfficer: false,
    });

    expect(client.subscriptions.has('public')).toBe(true);
    expect(client.isAdminOrOfficer).toBe(false);
  });

  it('should auto-subscribe admin clients to admin and user channels', () => {
    const mockWs = {
      readyState: 1,
      send: vi.fn(),
      on: vi.fn(),
      ping: vi.fn(),
      terminate: vi.fn(),
    };

    const client = service.registerClient(mockWs, {
      userId: 'admin-user-1',
      role: 'ADMIN',
      isAdminOrOfficer: true,
    });

    expect(client.subscriptions.has('public')).toBe(true);
    expect(client.subscriptions.has('admin')).toBe(true);
    expect(client.subscriptions.has('user:admin-user-1')).toBe(true);
  });

  it('should reject unauthorized subscription attempts to admin channel', () => {
    const mockWs = {
      readyState: 1,
      send: vi.fn(),
      on: vi.fn(),
      ping: vi.fn(),
      terminate: vi.fn(),
    };

    const guestClient = service.registerClient(mockWs, {
      userId: 'regular-user',
      role: 'MEMBER',
      isAdminOrOfficer: false,
    });

    const success = service.subscribe(guestClient, 'admin');
    expect(success).toBe(false);
    expect(guestClient.subscriptions.has('admin')).toBe(false);
  });

  it('should broadcast public campaign progress updates with zero private donor data', () => {
    const mockWs = {
      readyState: 1,
      send: vi.fn(),
      on: vi.fn(),
      ping: vi.fn(),
      terminate: vi.fn(),
    };

    service.registerClient(mockWs, {
      userId: null,
      role: null,
      isAdminOrOfficer: false,
    });

    service.publishCampaignProgress({
      campaignId: 'camp-123',
      slug: 'winter-drive',
      collectedAmount: 50000,
      goalAmount: 100000,
      progressPercentage: 50,
      remainingAmount: 50000,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    });

    expect(mockWs.send).toHaveBeenCalled();
    const sentData = JSON.parse(mockWs.send.mock.calls[0]![0]);

    expect(sentData.event).toBe('CAMPAIGN_PROGRESS_UPDATED');
    expect(sentData.data.collectedAmount).toBe(50000);
    expect(sentData.data.donorName).toBeUndefined();
    expect(sentData.data.donorPhone).toBeUndefined();
    expect(sentData.data.trxId).toBeUndefined();
  });
});

