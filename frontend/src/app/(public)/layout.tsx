import { PageContainer } from '@/components/layout/PageContainer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 py-8">
        <PageContainer>{children}</PageContainer>
      </main>
    </div>
  );
}
