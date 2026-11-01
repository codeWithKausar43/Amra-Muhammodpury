import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-emerald-700">আমরা মুহাম্মদপুরী</CardTitle>
          <CardDescription>Amra Muhammadpuri Platform Core Architecture Foundation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Frontend foundation established with Next.js App Router, Tailwind CSS, TypeScript strict
            mode, and decoupled REST backend service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
