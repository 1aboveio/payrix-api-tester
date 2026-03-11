'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
import { updateTransactionAction, deleteTransactionAction, getTransactionAction, listMerchantsAction } from '@/actions/platform';
import type { UpdateTransactionRequest, Merchant, Transaction, TransactionStatus } from '@/lib/platform/types';
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
  'refunded',
  'voided',
  'returned',
];

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  const { config } = usePayrixConfig();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<UpdateTransactionRequest>>({
    amount: 0,
    currency: 'USD',
    type: '',
    status: 'pending',
    description: '',
    customer: '',
    tip: 0,
  });

  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [panelEndpoint, setPanelEndpoint] = useState(`/txns/${transactionId}`);
  const [panelMethod, setPanelMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('PUT');
  const [panelFilters, setPanelFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  // Fetch transaction and merchants
  useEffect(() => {
    const fetchData = async () => {
      if (!config.platformApiKey || !transactionId) return;
      
      try {
        const requestId = generateRequestId();
        
        // Fetch transaction
        const txnResponse = await getTransactionAction({ config, requestId }, transactionId);
        if (txnResponse.apiResponse.data) {
          const txn = (txnResponse.apiResponse.data as Transaction[])[0];
          setFormData({
            amount: txn.amount,
            currency: txn.currency,
            type: txn.type,
            status: txn.status,
            description: txn.description,
            customer: txn.customer,
            tip: txn.tip,
          });
        }

        // Fetch merchants
        const merchantResponse = await listMerchantsAction({ config, requestId }, [], { page: 1, limit: 100 });
        if (merchantResponse.apiResponse.data) {
          setMerchants(merchantResponse.apiResponse.data as Merchant[]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load transaction');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [config.platformApiKey, transactionId]);

  // Update request preview when form changes
  useEffect(() => {
    setRequestPreview(formData);
  }, [formData]);

  const handleChange = (field: keyof UpdateTransactionRequest, value: string | number) => {
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
      const response = await updateTransactionAction({ config, requestId }, transactionId, formData as UpdateTransactionRequest);
      
      setResult(response);
      
      if (!response.apiResponse.error) {
        toast.success('Transaction updated successfully');
        router.push(`/platform/transactions/${transactionId}`);
      } else {
        const errorMsg = typeof response.apiResponse.error === 'string' 
          ? response.apiResponse.error 
          : (response.apiResponse.error as any)?.message || 'Failed to update transaction';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setLoading(true);
    try {
      const requestId = generateRequestId();
      const response = await deleteTransactionAction({ config, requestId }, transactionId);
      
      setResult(response);
      setPanelMethod('DELETE');
      
      if (!response.apiResponse.error) {
        toast.success('Transaction deleted successfully');
        router.push('/platform/transactions');
      } else {
        const errorMsg = typeof response.apiResponse.error === 'string' 
          ? response.apiResponse.error 
          : (response.apiResponse.error as any)?.message || 'Failed to delete transaction';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/platform/transactions/${transactionId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Transaction
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <CreditCard className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Edit Transaction</h1>
          <p className="text-muted-foreground">
            Update transaction record
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Transaction Type</Label>
                <Input
                  id="type"
                  value={formData.type || ''}
                  onChange={(e) => handleChange('type', e.target.value)}
                  placeholder="sale, authorization, etc."
                  disabled
                />
                <p className="text-xs text-muted-foreground">Type cannot be changed</p>
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

          {/* Amount */}
          <Card>
            <CardHeader>
              <CardTitle>Amount</CardTitle>
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
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between mt-6">
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            Delete Transaction
          </Button>
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
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
