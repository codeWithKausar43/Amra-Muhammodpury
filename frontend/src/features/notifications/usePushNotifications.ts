'use client';

import * as React from 'react';
import { notificationAudio } from '@/lib/audio/notificationSound';
import { notificationService } from './services/notification.service';
import { toast } from '@/components/feedback/Toast';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          // Check if already subscribed to push
          const sub = await registration.pushManager.getSubscription();
          setIsSubscribed(Boolean(sub));
        })
        .catch((err) => {
          console.warn('SW registration warning:', err);
        });
    }
  }, []);

  /**
   * Request push notification permission, register with push service, & save to backend
   */
  const enableNotifications = React.useCallback(async () => {
    if (!isSupported) {
      toast.warning('আপনার বর্তমান ডিভাইসে ব্রাউজার পুশ নোটিফিকেশন সমর্থিত নয়।');
      return false;
    }

    try {
      setLoading(true);
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        // 1. Play sweet chime sound at high volume
        await notificationAudio.play(1.0);

        // 2. Subscribe with VAPID Key
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          try {
            const vapidKey = await notificationService.getVapidPublicKey();
            if (vapidKey) {
              const convertedKey = urlBase64ToUint8Array(vapidKey);
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey,
              });
            }
          } catch (err) {
            console.warn('Push manager subscription warning (FCM/VAPID):', err);
          }
        }

        if (sub) {
          try {
            await notificationService.subscribePush(sub);
            setIsSubscribed(true);
          } catch (e) {
            console.warn('Failed to send push sub to backend:', e);
          }
        }

        // 3. Show instant system push notification
        reg.showNotification('মোহাম্মদপুর কমিউনিটি 🔔', {
          body: '🎵 নোটিফিকেশন সফলভাবে চালু হয়েছে! অ্যাপ বন্ধ থাকলেও মোবাইল ডাটা অন থাকলেই আপনার ফোনে সাউন্ড সহ নোটিফিকেশন আসবে।',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: [300, 100, 300, 100, 300],
          sound: '/sounds/notification.wav',
          data: { url: '/organization/member' },
          tag: 'welcome-push',
        } as any);

        return true;
      } else {
        toast.warning('ফোনে নোটিফিকেশন পেতে হলে ব্রাউজারের সাইট সেটিংসে গিয়ে Notifications Enable করুন।');
        return false;
      }
    } catch (err: any) {
      console.error('Notification enable error:', err);
      toast.error('নোটিফিকেশন সক্রিয় করতে সমস্যা হয়েছে: ' + (err?.message || 'Error'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  /**
   * Test the sweet notification chime & system push alert
   */
  const testSweetSound = React.useCallback(async () => {
    // 1. Play sweet melodious chime at full volume
    await notificationAudio.play(1.0);

    // 2. Trigger notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            reg.showNotification('মোহাম্মদপুর কমিউনিটি • সাউন্ড টেস্ট 🎵', {
              body: 'মিষ্টি নোটিফিকেশন সাউন্ড এবং পুশ অ্যালার্ট সফলভাবে বাজছে!',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              vibrate: [300, 100, 300, 100, 300],
              sound: '/sounds/notification.wav',
              tag: 'test-' + Date.now(),
            } as any);
            // Also trigger backend test if subscribed
            notificationService.sendTestPush().catch(() => {});
            return;
          } catch {
            // fallback
          }
        }
        new Notification('মোহাম্মদপুর কমিউনিটি • সাউন্ড টেস্ট 🎵', {
          body: 'মিষ্টি নোটিফিকেশন সাউন্ড বাজছে!',
          icon: '/icons/icon-192x192.png',
        });
      } else {
        await enableNotifications();
      }
    }
  }, [enableNotifications]);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    enableNotifications,
    testSweetSound,
    playSound: () => notificationAudio.play(1.0),
  };
}
