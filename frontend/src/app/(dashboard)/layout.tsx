import { PageContainer } from '@/components/layout/PageContainer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-brand-charcoal-dark text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <main className="flex-1 py-4 sm:py-8">
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
