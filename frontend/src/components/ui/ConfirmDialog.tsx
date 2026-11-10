'use client';

import * as React from 'react';
import { Loader2, Trash2, Ban, Crown, CheckCircle2, X } from 'lucide-react';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'crown' | 'primary';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  inputPrompt?: {
    label: string;
    placeholder?: string;
    value: string;
    onChange: (val: string) => void;
  };
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'নিশ্চিত করুন',
  cancelText = 'বাতিল',
  variant = 'primary',
  isLoading = false,
  inputPrompt,
}: ConfirmDialogProps) {
  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          iconBg: 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20',
          confirmBtn:
            'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 active:scale-[0.98]',
        };
      case 'warning':
        return {
          icon: <Ban className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          iconBg: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20',
          confirmBtn:
            'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25 active:scale-[0.98]',
        };
      case 'crown':
        return {
          icon: <Crown className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
          iconBg: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20',
          confirmBtn:
            'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.98]',
        };
      case 'primary':
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-brand-emerald dark:text-emerald-400" />,
          iconBg: 'bg-brand-emerald/10 border-brand-emerald/20',
          confirmBtn:
            'bg-brand-emerald hover:bg-emerald-700 text-white shadow-lg shadow-brand-emerald/25 active:scale-[0.98]',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md bg-white dark:bg-[#141F1B] rounded-3xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${vStyles.iconBg}`}
            >
              {vStyles.icon}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content / Description */}
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-0.5">
          {description}
        </div>

        {/* Optional Input Prompt */}
        {inputPrompt && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {inputPrompt.label}
            </label>
            <input
              type="text"
              value={inputPrompt.value}
              onChange={(e) => inputPrompt.onChange(e.target.value)}
              placeholder={inputPrompt.placeholder}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-emerald transition-colors"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={async () => {
              await onConfirm();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${vStyles.confirmBtn}`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
