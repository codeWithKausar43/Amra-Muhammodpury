import { PageContainer } from '@/components/layout/PageContainer';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 py-12">
      <PageContainer size="narrow">{children}</PageContainer>
    </div>
  );
}
