'use client';

import * as React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1">
        <div className="relative group">
          {/* Lock Icon */}
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500 peer-focus:text-brand-emerald group-focus-within:text-brand-emerald transition-colors duration-200">
            <Lock className="w-4 h-4" />
          </div>

          {/* Password Input Field */}
          <input
            id={inputId}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            placeholder=" " // Required for peer-placeholder-shown
            className={cn(
              'peer w-full pl-10 pr-11 pt-3.5 pb-2.5 sm:pt-4 sm:pb-3 rounded-2xl text-sm transition-all duration-200 outline-none',
              'bg-white/80 dark:bg-brand-charcoal-dark/70',
              'border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white',
              'focus:border-brand-emerald dark:focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15',
              error && 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className,
            )}
            {...props}
          />

          {/* Floating Notched Label */}
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute pointer-events-none transition-all duration-200 origin-[0] z-10',
                'px-1.5 rounded-sm bg-white dark:bg-brand-charcoal-dark',
                // Resting state (placeholder shown, not focused)
                'left-10 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500 font-normal',
                // Floating state on focus
                'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:left-3.5 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-brand-emerald dark:peer-focus:text-brand-mint',
                // Floating state when content exists
                'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:left-3.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-slate-700 dark:peer-[:not(:placeholder-shown)]:text-slate-200',
                error && 'peer-focus:text-red-500 dark:peer-focus:text-red-400 text-red-500',
              )}
            >
              {label}
            </label>
          )}

          {/* Toggle Password Visibility Button */}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
            aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-red-600 dark:text-red-400 font-medium pl-1 animate-fadeIn">
            {error}
          </p>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
