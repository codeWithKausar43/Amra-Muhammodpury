import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export default function RegisterPage() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>User registration portal placeholder</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500">
          Ready for registration flow integration matching backend schema contracts.
        </p>
      </CardContent>
    </Card>
  );
}
