import { PageContainer } from '@/components/layout/PageContainer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <main className="flex-1 py-6">
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
