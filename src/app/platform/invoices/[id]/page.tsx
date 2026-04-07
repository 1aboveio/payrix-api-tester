'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Trash2, FileText, Plus, CreditCard, Copy, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import {
  deleteInvoiceAction,
  deleteInvoiceItemAction,
  getInvoiceAction,
  listInvoiceItemsAction,
  createCatalogItemAction,
  createInvoiceLineItemAction,
} from '@/actions/platform';
import type { CreateInvoiceLineItemRequest, CreateCatalogItemRequest, Invoice, InvoiceLineItem, InvoiceStatus } from '@/lib/platform/types';
import { getMerchantDisplay } from '@/lib/platform/types';
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
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '-';
    const num = Number(trimmed);
    return Number.isFinite(num) ? `$${(num / 100).toFixed(2)}` : '-';
  }
  return Number.isFinite(value) ? `$${(value / 100).toFixed(2)}` : '-';
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
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [creatingLineItem, setCreatingLineItem] = useState(false);
  const [deletingLineItemId, setDeletingLineItemId] = useState<string | null>(null);
  const [lineItemForm, setLineItemForm] = useState({
    item: '',
    description: '',
    quantity: '1',
    price: '',
    taxable: true,
  });

  const invoiceId = params.id as string;

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!activePlatform(config).platformApiKey || !invoiceId) return;

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

        const lineItemRequestId = generateRequestId();
        setPanelMethod('GET');
        setPanelEndpoint('/invoiceitems');
        setRequestPreview({ filters: [{ field: 'invoice', operator: 'eq', value: invoiceId }] });
        const lineItemResult = await listInvoiceItemsAction(
          { config, requestId: lineItemRequestId },
          [{ field: 'invoice', operator: 'eq', value: invoiceId }],
          { page: 1, limit: 100 }
        );
        setResult(lineItemResult as ServerActionResult<unknown>);
        if (!lineItemResult.apiResponse.error) {
          setLineItems((lineItemResult.apiResponse.data as InvoiceLineItem[]) ?? []);
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
    if (!activePlatform(config).platformApiKey || !invoiceId) return;

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

  const handleCreateLineItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activePlatform(config).platformApiKey || !invoiceId) return;
    if (!lineItemForm.item.trim() || !lineItemForm.price.trim()) {
      toast.error('Line item name and price are required');
      return;
    }

    setCreatingLineItem(true);
    try {
      const requestId = generateRequestId();

      // ============ STEP 1: Create catalog item ============
      const login = (invoice as any)?.login;
      if (!login) {
        toast.error('Invoice login not found');
        setCreatingLineItem(false);
        return;
      }

      const catalogBody: CreateCatalogItemRequest = {
        login,
        item: lineItemForm.item.trim(),
        description: lineItemForm.description.trim() || undefined,
        price: Math.round(Number(lineItemForm.price) * 100), // Convert to cents
        um: 'each',
      };

      setPanelMethod('POST');
      setPanelEndpoint('/invoiceItems');
      setRequestPreview(catalogBody);

      const catalogResult = await createCatalogItemAction({ config, requestId }, catalogBody);

      if (catalogResult.apiResponse.error) {
        toast.error(`Failed to create catalog item: ${catalogResult.apiResponse.error}`);
        setCreatingLineItem(false);
        return;
      }

      const catalogData = (catalogResult.apiResponse.data as any[])?.[0];
      if (!catalogData || !catalogData.id) {
        toast.error('Failed to get catalog item ID');
        setCreatingLineItem(false);
        return;
      }

      const catalogItemId = catalogData.id;

      // ============ STEP 2: Link catalog item to invoice ============
      const payload: CreateInvoiceLineItemRequest & { invoice: string } = {
        invoice: invoiceId,
        invoiceItem: catalogItemId,
        quantity: Number(lineItemForm.quantity) || 1,
        price: Math.round(Number(lineItemForm.price) * 100), // Convert to cents
      };

      setPanelEndpoint('/invoiceLineItems');
      setRequestPreview(payload);
      const createResult = await createInvoiceLineItemAction({ config, requestId }, payload);
      setResult(createResult as ServerActionResult<unknown>);
      if (createResult.apiResponse.error) {
        toast.error(createResult.apiResponse.error);
        return;
      }

      const refreshRequestId = generateRequestId();
      const listResult = await listInvoiceItemsAction(
        { config, requestId: refreshRequestId },
        [{ field: 'invoice', operator: 'eq', value: invoiceId }],
        { page: 1, limit: 100 }
      );
      setResult(listResult as ServerActionResult<unknown>);
      setLineItems((listResult.apiResponse.data as InvoiceLineItem[]) ?? []);
      setLineItemForm({ item: '', description: '', quantity: '1', price: '', taxable: true });
      toast.success('Line item created');
    } catch (error) {
      toast.error('Failed to create line item');
      console.error(error);
    } finally {
      setCreatingLineItem(false);
    }
  };

  const handleDeleteLineItem = async (lineItemId: string) => {
    if (!activePlatform(config).platformApiKey || !invoiceId) return;
    setDeletingLineItemId(lineItemId);
    try {
      const requestId = generateRequestId();
      setPanelMethod('DELETE');
      setPanelEndpoint(`/invoiceitems/${lineItemId}`);
      setRequestPreview({});
      const deleteResult = await deleteInvoiceItemAction({ config, requestId }, lineItemId);
      setResult(deleteResult as ServerActionResult<unknown>);
      if (deleteResult.apiResponse.error) {
        toast.error(deleteResult.apiResponse.error);
        return;
      }

      setLineItems((prev) => prev.filter((item) => item.id !== lineItemId));
      toast.success('Line item deleted');
    } catch (error) {
      toast.error('Failed to delete line item');
      console.error(error);
    } finally {
      setDeletingLineItemId(null);
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
  const portalHost = config.platformEnvironment === 'test' ? 'test-portal' : 'portal';
  const payrixInvoiceUrl = `https://${portalHost}.payrix.com/invoices/pay/${invoice.id}`;

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(payrixInvoiceUrl);
              toast.success('Invoice URL copied to clipboard');
            }}
          >
            <Copy className="mr-2 size-4" />
            Copy Invoice URL
          </Button>

          <Button asChild variant="outline" size="sm">
            <a href={payrixInvoiceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Open Invoice
            </a>
          </Button>

          {invoice.status !== 'paid' && (
            <Button asChild size="sm">
              <Link href={`/platform/checkout?invoiceId=${invoice.id}`}>
                <CreditCard className="mr-2 size-4" />
                Pay
              </Link>
            </Button>
          )}

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

          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Line Items</p>
            </div>

            <form className="grid gap-3 md:grid-cols-6" onSubmit={handleCreateLineItem}>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="item-name">Item</Label>
                <Input
                  id="item-name"
                  value={lineItemForm.item}
                  onChange={(e) => setLineItemForm((prev) => ({ ...prev, item: e.target.value }))}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="item-description">Description</Label>
                <Input
                  id="item-description"
                  value={lineItemForm.description}
                  onChange={(e) => setLineItemForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="item-qty">Qty</Label>
                <Input
                  id="item-qty"
                  type="number"
                  min="1"
                  value={lineItemForm.quantity}
                  onChange={(e) => setLineItemForm((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="item-price">Price</Label>
                <Input
                  id="item-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={lineItemForm.price}
                  onChange={(e) => setLineItemForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-6">
                <input
                  id="item-taxable"
                  type="checkbox"
                  checked={lineItemForm.taxable}
                  onChange={(e) => setLineItemForm((prev) => ({ ...prev, taxable: e.target.checked }))}
                />
                <Label htmlFor="item-taxable">Taxable</Label>
                <Button type="submit" size="sm" disabled={creatingLineItem}>
                  <Plus className="mr-1 size-4" />
                  {creatingLineItem ? 'Adding...' : 'Add Line Item'}
                </Button>
              </div>
            </form>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Taxable</TableHead>
                    <TableHead className="w-[90px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                        No line items
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.description || '-'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrencySafe(item.price)}</TableCell>
                        <TableCell>{item.taxable ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteLineItem(item.id)}
                            disabled={deletingLineItemId === item.id}
                          >
                            {deletingLineItemId === item.id ? '...' : 'Delete'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* IDs */}
          <Separator />
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Invoice ID</p>
              <p className="font-mono">{invoice.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Merchant</p>
              <p className="font-mono">{getMerchantDisplay(invoice.merchant)}</p>
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
