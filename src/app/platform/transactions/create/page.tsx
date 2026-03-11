'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';

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
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { createTransactionAction, listMerchantsAction } from '@/actions/platform';
import type { CreateTransactionRequest, Merchant, TransactionType, TransactionOrigin } from '@/lib/platform/types';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_ORIGIN_LABELS } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';
import type { PlatformSearchFilter } from '@/lib/platform/types';

const TRANSACTION_TYPE_OPTIONS: TransactionType[] = [1, 2, 3, 4, 5, 7, 8, 14];
const TRANSACTION_ORIGIN_OPTIONS: TransactionOrigin[] = [1, 2, 3, 4, 8, 12];

export default function CreateTransactionPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state - using Payrix numeric types
  const [formData, setFormData] = useState<Partial<CreateTransactionRequest>>({
    login: '',
    merchant: '',
    mid: '',
    type: 1, // Sale
    total: 0,
    currency: 'USD',
    fundingCurrency: 'USD',
    origin: 2, // eCommerce
    swiped: 0,
    allowPartial: 0,
    pin: 0,
    signature: 0,
    unattended: 0,
    debtRepayment: 0,
    authentication: undefined,
    unauthReason: 'customerCancelled',
    fortxn: undefined,
    token: '',
    customer: '',
    tip: 0,
    tax: 0,
    description: '',
    order: '',
  });

  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [panelEndpoint, setPanelEndpoint] = useState('/txns');
  const [panelMethod, setPanelMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [panelFilters, setPanelFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  // Fetch merchants for dropdown
  useEffect(() => {
    const fetchMerchants = async () => {
      if (!config.platformApiKey) return;
      
      try {
        const requestId = generateRequestId();
        setPanelEndpoint('/merchants');
        const response = await listMerchantsAction({ config, requestId }, [], { page: 1, limit: 100 });
        
        if (response.apiResponse.data) {
          setMerchants(response.apiResponse.data as Merchant[]);
        }
      } catch (error) {
        console.error('Failed to fetch merchants:', error);
      }
    };

    fetchMerchants();
  }, [config.platformApiKey]);

  // Update request preview when form changes
  useEffect(() => {
    // Clean up null values for the preview
    const cleaned: Record<string, unknown> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    setRequestPreview(cleaned);
  }, [formData]);

  const handleChange = (field: keyof CreateTransactionRequest, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.login) {
      newErrors.login = 'Login is required';
    }
    if (!formData.merchant) {
      newErrors.merchant = 'Merchant is required';
    }
    if (!formData.mid) {
      newErrors.mid = 'MID (Processor Merchant ID) is required';
    }
    if (!formData.total || formData.total <= 0) {
      newErrors.total = 'Total must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      
      // Clean up payload - remove empty strings and nulls
      const payload: Record<string, unknown> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '' && value !== undefined) {
          payload[key] = value;
        }
      });
      
      const response = await createTransactionAction({ config, requestId }, payload as unknown as CreateTransactionRequest);
      
      setResult(response);
      
      if (!response.apiResponse.error) {
        const data = (response.apiResponse.data as any[])?.[0];
        if (data?.id) {
          toast.success('Transaction created successfully');
          router.push(`/platform/transactions/${data.id}`);
          return;
        }
      } else {
        const errorMsg = typeof response.apiResponse.error === 'string' 
          ? response.apiResponse.error 
          : (response.apiResponse.error as any)?.message || 'Failed to create transaction';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error('Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/platform/transactions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transactions
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Create Transaction</h1>
          <p className="text-muted-foreground">
            Create a new platform transaction (Sale, Auth, Refund, etc.)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Merchant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Merchant Info</CardTitle>
              <CardDescription>Select merchant and enter processor ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">Login ID *</Label>
                <Input
                  id="login"
                  value={formData.login || ''}
                  onChange={(e) => handleChange('login', e.target.value)}
                  placeholder="t1_log_xxxx"
                />
                {errors.login && (
                  <p className="text-sm text-destructive">{errors.login}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant *</Label>
                <Select
                  value={formData.merchant || ''}
                  onValueChange={(value) => handleChange('merchant', value)}
                >
                  <SelectTrigger id="merchant">
                    <SelectValue placeholder="Select merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    {merchants.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.merchant && (
                  <p className="text-sm text-destructive">{errors.merchant}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mid">MID (Processor Merchant ID) *</Label>
                <Input
                  id="mid"
                  value={formData.mid || ''}
                  onChange={(e) => handleChange('mid', e.target.value)}
                  placeholder="01170981"
                />
                {errors.mid && (
                  <p className="text-sm text-destructive">{errors.mid}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Processor-assigned merchant ID
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
              <CardDescription>Type, amount, and payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Transaction Type *</Label>
                <Select
                  value={String(formData.type || 1)}
                  onValueChange={(value) => handleChange('type', parseInt(value))}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={String(t)}>
                        {t} - {TRANSACTION_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total">Total Amount (cents) *</Label>
                <Input
                  id="total"
                  type="number"
                  value={formData.total || ''}
                  onChange={(e) => handleChange('total', parseInt(e.target.value) || 0)}
                  placeholder="2000 = $20.00"
                />
                {errors.total && (
                  <p className="text-sm text-destructive">{errors.total}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">Tax (cents)</Label>
                <Input
                  id="tax"
                  type="number"
                  value={formData.tax || ''}
                  onChange={(e) => handleChange('tax', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token ID (optional)</Label>
                <Input
                  id="token"
                  value={formData.token || ''}
                  onChange={(e) => handleChange('token', e.target.value)}
                  placeholder="t1_tok_xxxx (if using saved payment)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Customer ID (optional)</Label>
                <Input
                  id="customer"
                  value={formData.customer || ''}
                  onChange={(e) => handleChange('customer', e.target.value)}
                  placeholder="t1_cus_xxxx"
                />
              </div>
            </CardContent>
          </Card>

          {/* Processing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Options</CardTitle>
              <CardDescription>Origin, flags, and authorization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Select
                  value={String(formData.origin || 2)}
                  onValueChange={(value) => handleChange('origin', parseInt(value))}
                >
                  <SelectTrigger id="origin">
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_ORIGIN_OPTIONS.map((o) => (
                      <SelectItem key={o} value={String(o)}>
                        {o} - {TRANSACTION_ORIGIN_LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="swiped">Swiped</Label>
                  <Select
                    value={String(formData.swiped ?? 0)}
                    onValueChange={(value) => handleChange('swiped', parseInt(value))}
                  >
                    <SelectTrigger id="swiped">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allowPartial">Allow Partial</Label>
                  <Select
                    value={String(formData.allowPartial ?? 0)}
                    onValueChange={(value) => handleChange('allowPartial', parseInt(value))}
                  >
                    <SelectTrigger id="allowPartial">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <Select
                    value={String(formData.pin ?? 0)}
                    onValueChange={(value) => handleChange('pin', parseInt(value))}
                  >
                    <SelectTrigger id="pin">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature">Signature</Label>
                  <Select
                    value={String(formData.signature ?? 0)}
                    onValueChange={(value) => handleChange('signature', parseInt(value))}
                  >
                    <SelectTrigger id="signature">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unattended">Unattended</Label>
                  <Select
                    value={String(formData.unattended ?? 0)}
                    onValueChange={(value) => handleChange('unattended', parseInt(value))}
                  >
                    <SelectTrigger id="unattended">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="debtRepayment">Debt Repayment</Label>
                  <Select
                    value={String(formData.debtRepayment ?? 0)}
                    onValueChange={(value) => handleChange('debtRepayment', parseInt(value))}
                  >
                    <SelectTrigger id="debtRepayment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fortxn">Reference Transaction (for Refund/Reverse)</Label>
                <Input
                  id="fortxn"
                  value={formData.fortxn || ''}
                  onChange={(e) => handleChange('fortxn', e.target.value || undefined)}
                  placeholder="t1_txn_xxxx (for refund/reverse)"
                />
                <p className="text-xs text-muted-foreground">
                  Required for Refund (type=5) or Reverse (type=4)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Currency & Description */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Currency & Additional Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency || 'USD'}
                    onValueChange={(value) => handleChange('currency', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundingCurrency">Funding Currency</Label>
                  <Select
                    value={formData.fundingCurrency || 'USD'}
                    onValueChange={(value) => handleChange('fundingCurrency', value)}
                  >
                    <SelectTrigger id="fundingCurrency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tip">Tip (cents)</Label>
                  <Input
                    id="tip"
                    type="number"
                    value={formData.tip || ''}
                    onChange={(e) => handleChange('tip', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Order Reference</Label>
                  <Input
                    id="order"
                    value={formData.order || ''}
                    onChange={(e) => handleChange('order', e.target.value)}
                    placeholder="INV-001"
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Transaction
          </Button>
        </div>
      </form>

      {result && (
        <PlatformApiResultPanel
          config={config}
          endpoint={panelEndpoint}
          method={panelMethod}
          requestPreview={requestPreview}
          result={result}
          loading={loading}
        />
      )}
    </div>
  );
}
