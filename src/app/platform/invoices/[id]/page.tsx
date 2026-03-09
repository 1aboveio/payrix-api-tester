'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Trash2, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getInvoiceAction, deleteInvoiceAction } from '@/actions/platform';
import type { Invoice, InvoiceStatus } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  cancelled: 'destructive',
  expired: 'destructive',
  viewed: 'default',
  paid: 'default',
  confirmed: 'default',
  refunded: 'outline',
  rejected: 'destructive',
};

function formatDateSafe(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
}

function formatCurrencySafe(value?: number | string | null): string {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '-';
    const num = Number(trimmed);
    return Number.isFinite(num) ? `$${num.toFixed(2)}` : '-';
  }
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : '-';
}

function normalizeEmails(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { config } = usePayrixConfig();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [panelEndpoint, setPanelEndpoint] = useState('');
  const [panelMethod, setPanelMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');

  const invoiceId = params.id as string;

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!config.platformApiKey || !invoiceId) return;

      setLoading(true);
      try {
        const requestId = generateRequestId();
        setPanelMethod('GET');
        setPanelEndpoint(`/invoices/${invoiceId}`);
        setRequestPreview({});
        const result = await getInvoiceAction({ config, requestId }, invoiceId);
        setResult(result as ServerActionResult<unknown>);

        if (result.apiResponse.error) {
          toast.error(result.apiResponse.error);
          return;
        }

        const data = result.apiResponse.data as Invoice[] | undefined;
        if (data && data.length > 0) {
          setInvoice(data[0]);
        } else {
          toast.error('Invoice not found');
        }
      } catch (error) {
        toast.error('Failed to fetch invoice');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [config, invoiceId]);

  const handleDelete = async () => {
    if (!config.platformApiKey || !invoiceId) return;

    setDeleting(true);
    try {
      const requestId = generateRequestId();
      setPanelMethod('DELETE');
      setPanelEndpoint(`/invoices/${invoiceId}`);
      setRequestPreview({});
      const result = await deleteInvoiceAction({ config, requestId }, invoiceId);
      setResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      toast.success('Invoice deleted successfully');
      router.push('/platform/invoices');
    } catch (error) {
      toast.error('Failed to delete invoice');
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/invoices">
            <ArrowLeft className="mr-2 size-4" />
            Back to Invoices
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Invoice not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailRecipients = normalizeEmails((invoice as any).emails);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/invoices">
            <ArrowLeft className="mr-2 size-4" />
            Back to Invoices
          </Link>
        </Button>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/platform/invoices/${invoice.id}/edit`}>
              <Edit className="mr-2 size-4" />
              Edit
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="mr-2 size-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete invoice {invoice.number}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="size-6" />
                {invoice.number}
              </CardTitle>
              <CardDescription className="mt-2">
                {invoice.title || 'No title'}
              </CardDescription>
            </div>
            <Badge variant={INVOICE_STATUS_COLORS[invoice.status]} className="text-base px-3 py-1">
              {invoice.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invoice Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{invoice.type || 'single'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-medium">{formatCurrencySafe((invoice as any).total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tax</p>
              <p className="font-medium">{formatCurrencySafe((invoice as any).tax)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Discount</p>
              <p className="font-medium">{formatCurrencySafe((invoice as any).discount)}</p>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDateSafe((invoice as any).created)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDateSafe((invoice as any).dueDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiration</p>
              <p className="font-medium">{formatDateSafe((invoice as any).expirationDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Status</p>
              <p className="font-medium">{invoice.emailStatus || '-'}</p>
            </div>
          </div>

          <Separator />

          {/* Message */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Message</p>
            <p className="text-sm bg-muted p-3 rounded">{invoice.message || 'No message'}</p>
          </div>

          {/* Emails */}
          {emailRecipients.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Email Recipients</p>
                <div className="flex flex-wrap gap-2">
                  {emailRecipients.map((email) => (
                    <Badge key={email} variant="secondary">{email}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* IDs */}
          <Separator />
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Invoice ID</p>
              <p className="font-mono">{invoice.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Merchant</p>
              <p className="font-mono">{invoice.merchant}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Login</p>
              <p className="font-mono">{invoice.login}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PlatformApiResultPanel
        config={config}
        endpoint={panelEndpoint || `/invoices/${invoiceId}`}
        method={panelMethod}
        requestPreview={requestPreview}
        result={result}
        loading={loading || deleting}
      />
    </div>
  );
}
