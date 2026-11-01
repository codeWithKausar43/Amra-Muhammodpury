import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-sm [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
  {
    variants: {
      variant: {
        default: 'bg-white text-slate-900 border-slate-200',
        info: 'bg-blue-50 text-blue-900 border-blue-200',
        success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        warning: 'bg-amber-50 text-amber-900 border-amber-200',
        error: 'bg-red-50 text-red-900 border-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
}

export function Alert({ className, variant, title, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {title && <h5 className="mb-1 font-semibold leading-none tracking-tight">{title}</h5>}
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}
