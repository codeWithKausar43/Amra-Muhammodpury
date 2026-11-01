import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'narrow' | 'wide' | 'full';
}

const sizeClasses = {
  default: 'max-w-7xl',
  narrow: 'max-w-4xl',
  wide: 'max-w-[1600px]',
  full: 'max-w-full',
};

export function PageContainer({
  className,
  size = 'default',
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}
