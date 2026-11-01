import type { Metadata } from 'next';
import { AppProviders } from '@/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'আমরা মুহাম্মদপুরী',
    template: '%s | আমরা মুহাম্মদপুরী',
  },
  description: 'Community platform connecting residents and initiatives.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
