import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export default function DashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Dashboard</CardTitle>
        <CardDescription>Protected dashboard view</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500">
          Route layout and composition established for authenticated workspace features.
        </p>
      </CardContent>
    </Card>
  );
}
