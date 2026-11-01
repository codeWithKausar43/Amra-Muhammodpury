import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center space-y-4">
      <h2 className="text-3xl font-bold tracking-tight text-slate-800">404 - Page Not Found</h2>
      <p className="text-sm text-slate-600 max-w-md">
        The requested resource could not be found. Please verify the URL or return to the main
        portal.
      </p>
      <Button asChild variant="default">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
