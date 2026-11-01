'use client';

import * as React from 'react';
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  Users2,
  Loader2,
} from 'lucide-react';
import { socialService, NotificationItem } from '@/features/social/services/social.service';

export default function NotificationsPage() {
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [actionLoading, setActionLoading] = React.useState(false);

  const loadNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await socialService.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await socialService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.isRead) {
      await socialService.markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'POST_LIKE':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'POST_COMMENT':
      case 'COMMENT_REPLY':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'FRIEND_REQUEST':
      case 'FRIEND_ACCEPT':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'GROUP_APPROVED':
      case 'GROUP_JOIN_REQUEST':
        return <Users2 className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-emerald" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-emerald" />
            <span>বিজ্ঞপ্তি ও নোটিফিকেশন</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {unreadCount > 0 ? `${unreadCount}টি অপঠিত বিজ্ঞপ্তি` : 'সব বিজ্ঞপ্তি পড়া হয়েছে'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={actionLoading}
            className="text-xs font-semibold text-brand-emerald hover:underline cursor-pointer"
          >
            সব পড়া হিসেবে চিহ্নিত করুন
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
          <p className="text-xs text-slate-400">নোটিফিকেশন লোড হচ্ছে...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 space-y-2">
          <Bell className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            আপাতত কোনো নতুন বিজ্ঞপ্তি নেই
          </h3>
          <p className="text-xs text-slate-400">
            আপনার পোস্টের লাইক, মন্তব্য বা ফ্রেন্ড রিকোয়েস্টের নোটিফিকেশন এখানে প্রদর্শিত হবে।
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                notif.isRead
                  ? 'bg-white/60 dark:bg-white/5 border-slate-200/60 dark:border-white/5 hover:border-slate-300'
                  : 'bg-emerald-50/70 dark:bg-brand-emerald/10 border-brand-emerald/30 shadow-soft'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shrink-0 shadow-xs">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {notif.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                  {notif.content}
                </p>
                <span className="text-[10px] text-slate-400 mt-1.5 block">
                  {new Date(notif.createdAt).toLocaleDateString('bn-BD', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })}
                </span>
              </div>
              {!notif.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-brand-emerald shrink-0 mt-1" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
