'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { getInvoiceAction, updateInvoiceAction } from '@/actions/platform';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { generateRequestId } from '@/lib/payrix/identifiers';
import type { Invoice, InvoiceStatus, InvoiceType, UpdateInvoiceRequest } from '@/lib/platform/types';
import { getMerchantDisplay } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

type EditInvoiceForm = {
  number: string;
  title: string;
  message: string;
  emails: string[];
  status: InvoiceStatus;
  type: InvoiceType;
  dueDate: string;
  expirationDate: string;
  sendOn: string;
  tax: string;
  discount: string;
  allowedPaymentMethods: string[];
};

const INITIAL_FORM: EditInvoiceForm = {
  number: '',
  title: '',
  message: '',
  emails: [],
  status: 'pending',
  type: 'single',
  dueDate: '',
  expirationDate: '',
  sendOn: '',
  tax: '',
  discount: '',
  allowedPaymentMethods: [],
};

function normalizeDateValue(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { config } = usePayrixConfig();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<EditInvoiceForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailInput, setEmailInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [panelMethod, setPanelMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!activePlatform(config).platformApiKey || !id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const requestId = generateRequestId();
        setPanelMethod('GET');
        setRequestPreview({});
        const result = await getInvoiceAction({ config, requestId }, id);
        setResult(result as ServerActionResult<unknown>);
        if (result.apiResponse.error) {
          toast.error(result.apiResponse.error);
          setInvoice(null);
          return;
        }

        const data = result.apiResponse.data as Invoice[] | Invoice | undefined;
        const item = Array.isArray(data) ? data[0] : data;
        if (!item) {
          toast.error('Invoice not found');
          setInvoice(null);
          return;
        }

        setInvoice(item);
        setFormData({
          number: item.number ?? '',
          title: item.title ?? '',
          message: item.message ?? '',
          emails: normalizeStringArray((item as any).emails),
          status: item.status ?? 'pending',
          type: item.type ?? 'single',
          dueDate: normalizeDateValue((item as any).dueDate),
          expirationDate: normalizeDateValue((item as any).expirationDate),
          sendOn: normalizeDateValue((item as any).sendOn),
          tax: typeof item.tax === 'number' ? String(item.tax) : '',
          discount: typeof item.discount === 'number' ? String(item.discount) : '',
          allowedPaymentMethods: normalizeStringArray((item as any).allowedPaymentMethods),
        });
      } catch (error) {
        toast.error('Failed to fetch invoice');
        setInvoice(null);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [config, id]);

  const canSubmit = useMemo(() => !!invoice && !loading && !saving, [invoice, loading, saving]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.number.trim()) nextErrors.number = 'Invoice number is required';
    if (!formData.status) nextErrors.status = 'Status is required';
    const invalidEmails = formData.emails.filter((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (invalidEmails.length > 0) nextErrors.emails = `Invalid email format: ${invalidEmails.join(', ')}`;
    if (formData.tax && Number.isNaN(Number(formData.tax))) nextErrors.tax = 'Tax must be a number';
    if (formData.discount && Number.isNaN(Number(formData.discount))) nextErrors.discount = 'Discount must be a number';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const addEmail = () => {
    const value = emailInput.trim();
    if (!value || formData.emails.includes(value)) return;
    setFormData((prev) => ({ ...prev, emails: [...prev.emails, value] }));
    setEmailInput('');
    if (errors.emails) setErrors((prev) => ({ ...prev, emails: '' }));
  };

  const addPaymentMethod = () => {
    const value = paymentMethodInput.trim();
    if (!value || formData.allowedPaymentMethods.includes(value)) return;
    setFormData((prev) => ({ ...prev, allowedPaymentMethods: [...prev.allowedPaymentMethods, value] }));
    setPaymentMethodInput('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activePlatform(config).platformApiKey || !invoice) {
      toast.error('Platform API key not configured');
      return;
    }
    if (!validate()) {
      toast.error('Please fix validation errors');
      return;
    }

    setSaving(true);
    try {
      const requestId = generateRequestId();
      const body: UpdateInvoiceRequest = {
        number: formData.number.trim(),
        title: formData.title.trim() || undefined,
        message: formData.message.trim() || undefined,
        emails: formData.emails.length > 0 ? formData.emails : undefined,
        status: formData.status,
        type: formData.type,
        dueDate: formData.dueDate || undefined,
        expirationDate: formData.expirationDate || undefined,
        sendOn: formData.sendOn || undefined,
        tax: formData.tax ? Number(formData.tax) : undefined,
        discount: formData.discount ? Number(formData.discount) : undefined,
        allowedPaymentMethods: formData.allowedPaymentMethods.length > 0 ? formData.allowedPaymentMethods : undefined,
      };
      setPanelMethod('PUT');
      setRequestPreview(body);

      const result = await updateInvoiceAction({ config, requestId }, id, body);
      setResult(result as ServerActionResult<unknown>);
      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      toast.success('Invoice updated successfully');
      router.push(`/platform/invoices/${id}`);
    } catch (error) {
      toast.error('Failed to update invoice');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href={`/platform/invoices/${id}`}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Invoice
        </Link>
      </Button>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Invoice</CardTitle>
            <CardDescription>Update editable invoice fields. Login and merchant are read-only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading invoice...</p>
            ) : !invoice ? (
              <p className="text-sm text-muted-foreground">Invoice not found.</p>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Login (read-only)</Label>
                    <Input value={invoice.login} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Merchant (read-only)</Label>
                    <Input value={getMerchantDisplay(invoice.merchant)} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="number">Invoice Number *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, number: e.target.value }));
                        if (errors.number) setErrors((prev) => ({ ...prev, number: '' }));
                      }}
                      className={errors.number ? 'border-destructive' : ''}
                    />
                    {errors.number && <p className="text-sm text-destructive">{errors.number}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: InvoiceStatus) => {
                        setFormData((prev) => ({ ...prev, status: value }));
                        if (errors.status) setErrors((prev) => ({ ...prev, status: '' }));
                      }}
                    >
                      <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="viewed">Viewed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: InvoiceType) => setFormData((prev) => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="multiUse">Multi-use</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax">Tax</Label>
                    <Input
                      id="tax"
                      value={formData.tax}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, tax: e.target.value }));
                        if (errors.tax) setErrors((prev) => ({ ...prev, tax: '' }));
                      }}
                      className={errors.tax ? 'border-destructive' : ''}
                    />
                    {errors.tax && <p className="text-sm text-destructive">{errors.tax}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount</Label>
                    <Input
                      id="discount"
                      value={formData.discount}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, discount: e.target.value }));
                        if (errors.discount) setErrors((prev) => ({ ...prev, discount: '' }));
                      }}
                      className={errors.discount ? 'border-destructive' : ''}
                    />
                    {errors.discount && <p className="text-sm text-destructive">{errors.discount}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expirationDate">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sendOn">Send On</Label>
                    <Input
                      id="sendOn"
                      type="date"
                      value={formData.sendOn}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sendOn: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Recipients</Label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                      placeholder="name@example.com"
                    />
                    <Button type="button" variant="outline" onClick={addEmail}>
                      Add
                    </Button>
                  </div>
                  {errors.emails && <p className="text-sm text-destructive">{errors.emails}</p>}
                  <div className="flex flex-wrap gap-2">
                    {formData.emails.map((email) => (
                      <div key={email} className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-sm">
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, emails: prev.emails.filter((item) => item !== email) }))}
                          aria-label={`Remove ${email}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Allowed Payment Methods</Label>
                  <div className="flex gap-2">
                    <Input
                      value={paymentMethodInput}
                      onChange={(e) => setPaymentMethodInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPaymentMethod())}
                      placeholder="credit"
                    />
                    <Button type="button" variant="outline" onClick={addPaymentMethod}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.allowedPaymentMethods.map((method) => (
                      <div key={method} className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-sm">
                        <span>{method}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              allowedPaymentMethods: prev.allowedPaymentMethods.filter((item) => item !== method),
                            }))
                          }
                          aria-label={`Remove ${method}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button type="submit" disabled={!canSubmit}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/platform/invoices/${id}`}>Cancel</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </form>

      <PlatformApiResultPanel
        config={config}
        endpoint={`/invoices/${id}`}
        method={panelMethod}
        requestPreview={requestPreview}
        result={result}
        loading={loading || saving}
      />
    </div>
  );
}
