import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export default function LoginPage() {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Authentication portal placeholder</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-500">
          Ready for auth form integration with React Hook Form and Zod validation.
        </p>
      </CardContent>
    </Card>
  );
}
