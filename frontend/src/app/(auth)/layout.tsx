import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'প্রবেশ ও নিবন্ধন | আমরা মুহাম্মদপুরী',
  description: 'আমরা মুহাম্মদপুরী প্ল্যাটফর্মের অথেন্টিকেশন পোর্টাল',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-center items-center p-3 sm:p-6 overflow-x-hidden transition-colors duration-300">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full bg-brand-emerald/15 dark:bg-brand-emerald/20 blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] max-w-[500px] max-h-[500px] rounded-full bg-brand-gold/10 dark:bg-brand-emerald/10 blur-[120px]" />
      </div>

      {/* Main container */}
      <main className="relative z-10 w-full flex flex-col items-center justify-center my-auto">
        {children}
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 mt-6 pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
        &copy; {new Date().getFullYear()} আমরা মুহাম্মদপুরী। সর্বস্বত্ব সংরক্ষিত।
      </footer>
    </div>
  );
}
