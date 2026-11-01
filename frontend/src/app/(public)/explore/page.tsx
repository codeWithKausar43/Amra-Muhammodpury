import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function ExplorePage() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Explore Module</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Route placeholder ready for community explore feed integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
