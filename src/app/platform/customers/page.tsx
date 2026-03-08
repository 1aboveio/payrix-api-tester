import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>Manage Payrix Platform customers.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/platform/customers/create">Create Customer</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Customer list will be implemented in the next iteration.
            This is a placeholder page for the Foundation PR.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
