import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function CreateInvoicePage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/invoices">
            <ArrowLeft className="mr-2 size-4" />
            Back to Invoices
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Invoice</CardTitle>
          <CardDescription>Create a new Payrix Platform invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create invoice form will be implemented in the next iteration.
            This is a placeholder page for the Foundation PR.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
