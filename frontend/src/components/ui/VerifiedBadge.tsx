'use client';

import * as React from 'react';

export interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

/**
 * VerifiedBadge - Official Organization Member Badge
 * 
 * Engineered for 100% crystal-clear contrast and visibility in both
 * Light Theme (vibrant royal blue circle + crisp white checkmark) and
 * Dark Theme (glowing bright blue circle + crisp white checkmark).
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  className = '',
  title = 'মোহাম্মদপুর কমিউনিটি সক্রিয় সদস্য (ভেরিফাইড)',
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center shrink-0 select-none align-middle ${className}`}
    >
      <svg
        className={`${sizeClasses} shrink-0 drop-shadow-xs transition-colors`}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Solid Blue Circle: High-contrast royal blue in light, vivid sky blue in dark */}
        <circle
          cx="8"
          cy="8"
          r="7.25"
          className="fill-blue-600 dark:fill-blue-500"
        />
        {/* Pure Crisp White Checkmark with Rounded Cap for Maximum Legibility */}
        <path
          d="M4.8 8.2L7 10.4L11.2 5.8"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

