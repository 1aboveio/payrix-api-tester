'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { createInvoiceAction, listMerchantsAction, createCatalogItemAction, createInvoiceLineItemAction } from '@/actions/platform';
import type { CreateInvoiceRequest, InvoiceStatus, InvoiceType, Merchant } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';
import type { PlatformSearchFilter } from '@/lib/platform/types';

interface LineItem {
  item: string;
  description: string;
  quantity: string;
  price: string;
  taxable: boolean;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { item: '', description: '', quantity: '1', price: '', taxable: true }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<CreateInvoiceRequest>>({
    login: '',
    merchant: '',
    number: '',
    status: 'pending',
    type: 'single',
    title: '',
    message: '',
    emails: [],
    tax: undefined,
    discount: undefined,
    dueDate: '',
    expirationDate: '',
    sendOn: '',
    allowedPaymentMethods: [],
  });

  const [emailInput, setEmailInput] = useState('');
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [panelEndpoint, setPanelEndpoint] = useState('/invoices');
  const [panelMethod, setPanelMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [panelFilters, setPanelFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  // Fetch merchants for dropdown
  useEffect(() => {
    const fetchMerchants = async () => {
      if (!config.platformApiKey) return;
      
      try {
        const requestId = generateRequestId();
        setPanelEndpoint('/merchants');
        setPanelMethod('GET');
        setPanelFilters(undefined);
        setRequestPreview({ filters: [], pagination: { page: 1, limit: 100 } });
        const result = await listMerchantsAction({ config, requestId }, undefined, { page: 1, limit: 100 });
        setResult(result as ServerActionResult<unknown>);
        
        if (result.apiResponse.data) {
          setMerchants(result.apiResponse.data as Merchant[]);
        }
      } catch (error) {
        console.error('Failed to fetch merchants:', error);
      }
    };

    fetchMerchants();
  }, [config]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.login?.trim()) {
      newErrors.login = 'Login ID is required';
    }
    if (!formData.merchant) {
      newErrors.merchant = 'Merchant is required';
    }
    if (!formData.number?.trim()) {
      newErrors.number = 'Invoice number is required';
    }
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    // Validate emails format
    if (formData.emails && formData.emails.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = formData.emails.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        newErrors.emails = `Invalid email format: ${invalidEmails.join(', ')}`;
      }
    }

    // Validate line items have positive price
    const invalidLineItems = lineItems.filter(
      item => item.item && (isNaN(Number(item.price)) || Number(item.price) <= 0)
    );
    if (invalidLineItems.length > 0) {
      newErrors.lineItems = 'Line items must have a valid positive price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.platformApiKey) {
      toast.error('Platform API key not configured');
      return;
    }

    // Validation
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      
      // Build line items (filter out empty ones)
      const validLineItems = lineItems.filter(item => item.item && item.price);
      
      // Get login from form
      const login = String(formData.login ?? '');

      // ============ STEP 1: Create catalog items ============
      // For each line item, create a catalog item and get its ID
      const catalogItemIds: string[] = [];
      
      for (const item of validLineItems) {
        const catalogBody = {
          login,
          item: item.item,
          description: item.description || undefined,
          price: Math.round(Number(item.price) * 100), // Convert to cents
          um: 'each',
        };
        
        setPanelEndpoint('/invoiceItems');
        setPanelMethod('POST');
        setRequestPreview(catalogBody);
        
        const catalogResult = await createCatalogItemAction({ config, requestId }, catalogBody);
        
        if (catalogResult.apiResponse.error) {
          toast.error(`Failed to create catalog item: ${catalogResult.apiResponse.error}`);
          setLoading(false);
          return;
        }
        
        // Get the created catalog item ID
        const catalogData = (catalogResult.apiResponse.data as any[])?.[0];
        if (catalogData && catalogData.id) {
          catalogItemIds.push(catalogData.id);
        } else {
          toast.error('Failed to get catalog item ID');
          setLoading(false);
          return;
        }
      }

      // ============ STEP 2: Create invoice (without line items) ============
      const sanitizedFormData = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => {
          if (value === '' || value === undefined) return false;
          if (Array.isArray(value)) return value.length > 0;
          return true;
        })
      ) as Partial<CreateInvoiceRequest>;

      const body: CreateInvoiceRequest = {
        ...sanitizedFormData,
        login: String(formData.login ?? ''),
        merchant: String(formData.merchant ?? ''),
        number: String(formData.number ?? ''),
        status: (formData.status ?? 'pending') as CreateInvoiceRequest['status'],
        // NOTE: Do NOT include invoiceLineItems here - they're added in step 3
      };
      
      setPanelEndpoint('/invoices');
      setPanelMethod('POST');
      setPanelFilters(undefined);
      setRequestPreview(body);

      const result = await createInvoiceAction({ config, requestId }, body);
      setResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        toast.error(`Failed to create invoice: ${result.apiResponse.error}`);
        setLoading(false);
        return;
      }

      // Get the created invoice ID
      const invoiceData = (result.apiResponse.data as any[])?.[0];
      if (!invoiceData || !invoiceData.id) {
        toast.error('Failed to get invoice ID');
        setLoading(false);
        return;
      }
      
      const invoiceId = invoiceData.id;

      // ============ STEP 3: Link catalog items to invoice ============
      for (let i = 0; i < catalogItemIds.length; i++) {
        const catalogItemId = catalogItemIds[i];
        const lineItem = validLineItems[i];
        
        const lineItemBody = {
          invoice: invoiceId,
          invoiceItem: catalogItemId,
          quantity: Number(lineItem.quantity) || 1,
          price: Math.round(Number(lineItem.price) * 100), // Convert to cents
        };
        
        setPanelEndpoint('/invoiceLineItems');
        setPanelMethod('POST');
        setRequestPreview(lineItemBody);
        
        const lineItemResult = await createInvoiceLineItemAction({ config, requestId }, lineItemBody);
        
        if (lineItemResult.apiResponse.error) {
          toast.error(`Failed to add line item: ${lineItemResult.apiResponse.error}`);
          setLoading(false);
          return;
        }
      }

      toast.success('Invoice created successfully');
      router.push('/platform/invoices');
    } catch (error) {
      toast.error('Failed to create invoice');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { item: '', description: '', quantity: '1', price: '', taxable: true }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | boolean) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const addEmail = () => {
    if (emailInput && !formData.emails?.includes(emailInput)) {
      setFormData({ ...formData, emails: [...(formData.emails || []), emailInput] });
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    setFormData({ ...formData, emails: formData.emails?.filter(e => e !== email) || [] });
  };

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

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create Invoice</CardTitle>
            <CardDescription>Create a new Payrix Platform invoice.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="login">Login ID *</Label>
                <Input
                  id="login"
                  value={formData.login}
                  onChange={(e) => {
                    setFormData({ ...formData, login: e.target.value });
                    if (errors.login) setErrors({ ...errors, login: '' });
                  }}
                  placeholder="Your login ID"
                  className={errors.login ? 'border-destructive' : ''}
                />
                {errors.login && <p className="text-sm text-destructive">{errors.login}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant *</Label>
                <Select 
                  value={formData.merchant} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, merchant: value });
                    if (errors.merchant) setErrors({ ...errors, merchant: '' });
                  }}
                >
                  <SelectTrigger
                    id="merchant"
                    aria-label="Merchant"
                    data-testid="invoice-merchant-select"
                    className={errors.merchant ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select merchant" />
                  </SelectTrigger>
                  <SelectContent data-testid="invoice-merchant-options">
                    {merchants.map((m) => (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                        data-testid={`invoice-merchant-option-${m.id}`}
                      >
                        {m.name} ({m.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.merchant && <p className="text-sm text-destructive">{errors.merchant}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Invoice Number *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => {
                    setFormData({ ...formData, number: e.target.value });
                    if (errors.number) setErrors({ ...errors, number: '' });
                  }}
                  placeholder="INV-001"
                  className={errors.number ? 'border-destructive' : ''}
                />
                {errors.number && <p className="text-sm text-destructive">{errors.number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: InvoiceStatus) => {
                    setFormData({ ...formData, status: value });
                    if (errors.status) setErrors({ ...errors, status: '' });
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: InvoiceType) => setFormData({ ...formData, type: value })}
                >
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
            </div>

            {/* Invoice Details */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Invoice title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Message to display on invoice"
                rows={3}
              />
            </div>

            {/* Emails */}
            <div className="space-y-2">
              <Label>Email Recipients</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errors.emails) setErrors({ ...errors, emails: '' });
                  }}
                  placeholder="Enter email address"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                  className={errors.emails ? 'border-destructive' : ''}
                />
                <Button type="button" variant="outline" onClick={addEmail}>Add</Button>
              </div>
              {errors.emails && <p className="text-sm text-destructive">{errors.emails}</p>}
              <div className="flex flex-wrap gap-2">
                {formData.emails?.map((email) => (
                  <div key={email} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                    <span className="text-sm">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-4"
                      onClick={() => removeEmail(email)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sendOn">Send On</Label>
                <Input
                  id="sendOn"
                  type="date"
                  value={formData.sendOn}
                  onChange={(e) => setFormData({ ...formData, sendOn: e.target.value })}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="mr-2 size-4" />
                  Add Item
                </Button>
              </div>
              
              {errors.lineItems && <p className="text-sm text-destructive">{errors.lineItems}</p>}

              {lineItems.map((item, index) => (
                <div key={index} className="grid gap-4 md:grid-cols-6 items-end border p-4 rounded-md">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs">Item Name *</Label>
                    <Input
                      value={item.item}
                      onChange={(e) => updateLineItem(index, 'item', e.target.value)}
                      placeholder="Item name"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateLineItem(index, 'price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`taxable-${index}`}
                        checked={item.taxable}
                        onChange={(e) => updateLineItem(index, 'taxable', e.target.checked)}
                        className="size-4"
                      />
                      <Label htmlFor={`taxable-${index}`} className="text-sm">Taxable</Label>
                    </div>

                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        className="text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Invoice'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/platform/invoices">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <PlatformApiResultPanel
        config={config}
        endpoint={panelEndpoint}
        method={panelMethod}
        requestPreview={requestPreview}
        result={result}
        loading={loading}
        searchFilters={panelFilters}
      />
    </div>
  );
}
