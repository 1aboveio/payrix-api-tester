'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Pencil } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EditInvoicePage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href={`/platform/invoices/${id}`}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Invoice
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="size-5" />
            Edit Invoice
          </CardTitle>
          <CardDescription>
            Invoice editing route is now available. Full editable form workflow can be added in a follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">Invoice ID:</span> {id}</p>
          <p>
            For now, use the invoice detail page actions while we finalize the full edit form.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/platform/invoices/${id}`}>Open Invoice Detail</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/platform/invoices">Back to Invoices List</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
