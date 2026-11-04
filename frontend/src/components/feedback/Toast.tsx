'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

type ToastListener = (toast: ToastItem) => void;
const toastListeners = new Set<ToastListener>();

export const toast = {
  show: (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
    const item: ToastItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      message,
      type,
      title,
      duration,
    };
    toastListeners.forEach((fn) => fn(item));
    return item.id;
  },
  success: (message: string, title?: string, duration = 4000) =>
    toast.show(message, 'success', title, duration),
  error: (message: string, title?: string, duration = 5000) =>
    toast.show(message, 'error', title, duration),
  warning: (message: string, title?: string, duration = 4500) =>
    toast.show(message, 'warning', title, duration),
  info: (message: string, title?: string, duration = 4000) =>
    toast.show(message, 'info', title, duration),
};

export function useToast() {
  return { toast };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  // Intercept window.alert so that browser "localhost:3000 says" never pops up
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalAlert = window.alert;
    window.alert = (message: any) => {
      const str = typeof message === 'string' ? message : String(message ?? '');
      if (
        str.includes('ব্যর্থ') ||
        str.includes('ভুল') ||
        str.includes('ত্রুটি') ||
        str.toLowerCase().includes('error') ||
        str.toLowerCase().includes('failed')
      ) {
        toast.error(str);
      } else if (
        str.includes('সফল') ||
        str.includes('সম্পন্ন') ||
        str.includes('ধন্যবাদ') ||
        str.includes('অনুমোদিত') ||
        str.toLowerCase().includes('success')
      ) {
        toast.success(str);
      } else {
        toast.info(str);
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  React.useEffect(() => {
    const handleNewToast: ToastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    };

    toastListeners.add(handleNewToast);
    return () => {
      toastListeners.delete(handleNewToast);
    };
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      {children}
      {/* Toast Notification Container */}
      <aside
        aria-live="polite"
        aria-label="বিজ্ঞপ্তি"
        className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] flex flex-col gap-2.5 max-w-[92vw] sm:max-w-md w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto w-full p-3.5 sm:p-4 rounded-2xl border shadow-xl backdrop-blur-md flex items-start gap-3 animate-in slide-in-from-top-3 fade-in duration-200 transition-all ${
              t.type === 'success'
                ? 'bg-white/95 dark:bg-[#141F1B]/95 border-emerald-500/40 text-slate-800 dark:text-slate-100 shadow-emerald-950/10'
                : t.type === 'error'
                ? 'bg-white/95 dark:bg-[#141F1B]/95 border-rose-500/40 text-slate-800 dark:text-slate-100 shadow-rose-950/10'
                : t.type === 'warning'
                ? 'bg-white/95 dark:bg-[#141F1B]/95 border-amber-500/40 text-slate-800 dark:text-slate-100 shadow-amber-950/10'
                : 'bg-white/95 dark:bg-[#141F1B]/95 border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-100 shadow-slate-950/10'
            }`}
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {t.type === 'error' && (
                <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              {t.type === 'warning' && (
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {t.type === 'info' && (
                <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              {t.title && (
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5">
                  {t.title}
                </h5>
              )}
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug break-words">
                {t.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </aside>
    </>
  );
}

