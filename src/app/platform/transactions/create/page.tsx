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
import type { CreateTransactionRequest, Merchant, TransactionStatus } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';
import type { PlatformSearchFilter } from '@/lib/platform/types';

const TRANSACTION_STATUS_OPTIONS: TransactionStatus[] = [
  'pending',
  'approved',
  'captured',
  'settled',
  'failed',
];

export default function CreateTransactionPage() {
  const router = useRouter();
  const { config } = usePayrixConfig();
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<CreateTransactionRequest>>({
    login: '',
    merchant: '',
    amount: 0,
    currency: 'USD',
    type: 'sale',
    status: 'pending',
    description: '',
    customer: '',
    tip: 0,
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
    setRequestPreview(formData);
  }, [formData]);

  const handleChange = (field: keyof CreateTransactionRequest, value: string | number) => {
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
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
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
      const response = await createTransactionAction({ config, requestId }, formData as CreateTransactionRequest);
      
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
            Create a new platform transaction record
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login">Login ID *</Label>
                <Input
                  id="login"
                  value={formData.login || ''}
                  onChange={(e) => handleChange('login', e.target.value)}
                  placeholder="Enter login ID"
                 
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
                <Label htmlFor="type">Transaction Type</Label>
                <Select
                  value={formData.type || 'sale'}
                  onValueChange={(value) => handleChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="authorization">Authorization</SelectItem>
                    <SelectItem value="capture">Capture</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="void">Void</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'pending'}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Amount & Details */}
          <Card>
            <CardHeader>
              <CardTitle>Amount & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (in cents) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => handleChange('amount', parseInt(e.target.value) || 0)}
                  placeholder="1000 = $10.00"
                 
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Amount in cents (1000 = $10.00)
                </p>
              </div>

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
                <Label htmlFor="tip">Tip (in cents)</Label>
                <Input
                  id="tip"
                  type="number"
                  value={formData.tip || ''}
                  onChange={(e) => handleChange('tip', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Customer ID</Label>
                <Input
                  id="customer"
                  value={formData.customer || ''}
                  onChange={(e) => handleChange('customer', e.target.value)}
                  placeholder="Optional customer ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Optional description"
                />
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
