import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InvoicesPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage Payrix Platform invoices.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/platform/invoices/create">Create Invoice</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Invoice list will be implemented in the next iteration. 
            This is a placeholder page for the Foundation PR.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
