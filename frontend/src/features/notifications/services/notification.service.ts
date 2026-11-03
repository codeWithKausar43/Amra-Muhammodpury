import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/types';

export const notificationService = {
  async getVapidPublicKey(): Promise<string> {
    const res = await apiClient<ApiResponse<{ publicKey: string }>>(
      '/notifications/vapid-public-key',
    );
    return res.data?.publicKey || '';
  },

  async subscribePush(subscription: PushSubscription): Promise<{ success: boolean }> {
    const subJson = subscription.toJSON();
    const res = await apiClient<ApiResponse<{ success: boolean }>>(
      '/notifications/push-subscribe',
      {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        }),
      },
    );
    return res.data!;
  },

  async sendTestPush(): Promise<{ success: boolean }> {
    const res = await apiClient<ApiResponse<{ success: boolean }>>(
      '/notifications/test-push',
      {
        method: 'POST',
      },
    );
    return res.data!;
  },
};

