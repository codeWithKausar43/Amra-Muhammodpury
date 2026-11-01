'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 space-y-4">
      <Alert variant="error" title="Something went wrong">
        {error.message || 'An unexpected application error occurred.'}
      </Alert>
      <Button onClick={() => reset()} variant="default">
        Try again
      </Button>
    </div>
  );
}
