'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, Undo2, RotateCcw } from 'lucide-react';

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
import { getTransactionAction, listMerchantsAction } from '@/actions/platform';
import type { Transaction, Merchant, TransactionType, TransactionOrigin } from '@/lib/platform/types';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_STATUS_LABELS } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';
import type { PlatformSearchFilter } from '@/lib/platform/types';

// Payrix operation types that can be performed on an existing transaction
type TransactionOperation = 'refund' | 'reverse';

const OPERATION_OPTIONS: { value: TransactionOperation; label: string; description: string; icon: typeof Undo2 }[] = [
  {
    value: 'refund',
    label: 'Refund',
    description: 'Refund a captured/settled transaction (type=5)',
    icon: RotateCcw,
  },
  {
    value: 'reverse',
    label: 'Reverse',
    description: 'Reverse an authorization (type=4)',
    icon: Undo2,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1.5 text-xs"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  const { config } = usePayrixConfig();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Operation form state
  const [operation, setOperation] = useState<TransactionOperation>('refund');
  const [formData, setFormData] = useState({
    total: 0,  // For partial refund
    description: '',
    fortxn: transactionId,  // Reference to original transaction
  });

  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [panelEndpoint, setPanelEndpoint] = useState('/txns');
  const [panelMethod, setPanelMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('POST');
  const [panelFilters, setPanelFilters] = useState<PlatformSearchFilter[] | undefined>(undefined);

  const curlCommand = useMemo(
    () =>
      buildPlatformCurlCommand({
        config,
        endpoint: panelEndpoint,
        method: panelMethod,
        body: requestPreview,
        searchFilters: panelFilters,
        redactApiKey: true,
      }),
    [config, panelEndpoint, panelMethod, panelFilters, requestPreview]
  );

  // Fetch transaction
  useEffect(() => {
    const fetchData = async () => {
      if (!config.platformApiKey || !transactionId) {
        setFetching(false);
        return;
      }
      
      try {
        const requestId = generateRequestId();
        
        // Fetch transaction
        const txnResponse = await getTransactionAction({ config, requestId }, transactionId);
        if (txnResponse.apiResponse.data) {
          const txn = (txnResponse.apiResponse.data as Transaction[])[0];
          setTransaction(txn);
          setFormData(prev => ({
            ...prev,
            total: txn.total || txn.amount || 0,  // Default to full amount for refund
          }));
        }

        // Fetch merchants for MID lookup
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
    const operationType: TransactionType = operation === 'refund' ? 5 : 4;
    const payload = {
      merchant: transaction?.merchant,
      mid: transaction?.mid,
      type: operationType,
      total: formData.total,
      currency: transaction?.currency || 'USD',
      fundingCurrency: transaction?.fundingCurrency || 'USD',
      origin: (transaction?.origin as TransactionOrigin) || (2 as TransactionOrigin),
      swiped: 0,
      allowPartial: 0,
      pin: 0,
      signature: 0,
      unattended: 0,
      debtRepayment: 0,
      fortxn: transactionId,
      description: formData.description,
    };
    setRequestPreview(payload);
  }, [formData, operation, transaction, transactionId]);

  const handleChange = (field: string, value: string | number) => {
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
    
    if (!transaction) {
      newErrors.transaction = 'Transaction not loaded';
    }
    if (!formData.total || formData.total <= 0) {
      newErrors.total = 'Amount must be greater than 0';
    }
    if (!transaction?.merchant) {
      newErrors.merchant = 'Transaction merchant not found';
    }
    if (!transaction?.mid) {
      newErrors.mid = 'Transaction MID is required for refund/reverse';
    }
    if (!transactionId) {
      newErrors.fortxn = 'Reference transaction ID is required';
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
      
      // Determine operation type
      const operationType: TransactionType = operation === 'refund' ? 5 : 4;
      
      // Build payload per Payrix spec
      // Note: merchant can be string or object from API - extract ID for request
      const merchantId = typeof transaction!.merchant === 'string' 
        ? transaction!.merchant 
        : transaction!.merchant.id;
      
      const payload = {
        merchant: merchantId,
        mid: transaction!.mid,
        type: operationType,
        total: formData.total,
        currency: transaction!.currency || 'USD',
        fundingCurrency: transaction!.fundingCurrency || 'USD',
        origin: 2 as TransactionOrigin,  // eCommerce
        swiped: 0,
        allowPartial: 0,
        pin: 0,
        signature: 0,
        unattended: 0,
        debtRepayment: 0,
        fortxn: transactionId,
        description: formData.description,
      };

      setPanelEndpoint('/txns');
      setPanelMethod('POST');
      
      // Use createTransactionAction to create the refund/reverse transaction
      const { createTransactionAction } = await import('@/actions/platform');
      const response = await createTransactionAction({ config, requestId }, payload);
      
      setResult(response);
      
      if (!response.apiResponse.error) {
        const data = (response.apiResponse.data as any[])?.[0];
        if (data?.id) {
          toast.success(`${operation === 'refund' ? 'Refund' : 'Reverse'} created successfully`);
          router.push(`/platform/transactions/${data.id}`);
          return;
        }
      } else {
        const errorMsg = typeof response.apiResponse.error === 'string' 
          ? response.apiResponse.error 
          : (response.apiResponse.error as any)?.message || `Failed to create ${operation}`;
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error(`Error creating ${operation}:`, error);
      toast.error(`Failed to create ${operation}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/platform/transactions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transactions
            </Link>
          </Button>
        </div>
        <div className="mt-6">
          <Card>
            <CardContent className="py-10">
              <p className="text-center text-muted-foreground">Transaction not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Determine available operations based on transaction status
  const canRefund = transaction.status === 3 || transaction.status === 4;  // Captured or Settled
  const canReverse = transaction.status === 1;  // Approved (authorized)

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
          <h1 className="text-2xl font-bold">Transaction Operations</h1>
          <p className="text-muted-foreground">
            Perform refund or reverse on transaction {transactionId}
          </p>
        </div>
      </div>

      {/* Transaction Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Original Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono">{transaction.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p>{TRANSACTION_STATUS_LABELS[transaction.status] ?? transaction.status}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p>{transaction.type ? TRANSACTION_TYPE_LABELS[transaction.type] : '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <p>${((transaction.total || transaction.amount) / 100).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">MID:</span>
              <p className={transaction.mid ? '' : 'text-destructive'}>{transaction.mid || 'Missing'}</p>
            </div>
          </div>
          {errors.mid && (
            <p className="text-sm text-destructive mt-2">{errors.mid}</p>
          )}
        </CardContent>
      </Card>

      {/* Operations Notice */}
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="pt-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Payrix does not support direct PUT/DELETE on transactions. 
            To modify a transaction, create a new transaction with type=5 (Refund) or type=4 (Reverse) 
            that references the original transaction via <code>fortxn</code>.
          </p>
        </CardContent>
      </Card>

      {/* Operation Selection */}
      <div className="grid gap-4 md:grid-cols-2">
        {OPERATION_OPTIONS.map((op) => {
          const Icon = op.icon;
          const isAvailable = op.value === 'refund' ? canRefund : canReverse;
          
          return (
            <Card 
              key={op.value}
              className={`cursor-pointer transition-all ${
                operation === op.value 
                  ? 'border-primary ring-2 ring-primary' 
                  : 'border-border'
              } ${!isAvailable ? 'opacity-50' : ''}`}
              onClick={() => isAvailable && setOperation(op.value)}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <Icon className="h-6 w-6" />
                <div>
                  <CardTitle className="text-lg">{op.label}</CardTitle>
                  <CardDescription>{op.description}</CardDescription>
                </div>
              </CardHeader>
              {!isAvailable && (
                <CardContent pt-0>
                  <p className="text-sm text-muted-foreground">
                    {op.value === 'refund' 
                      ? 'Only captured/settled transactions can be refunded'
                      : 'Only authorized transactions can be reversed'
                    }
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Operation Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{operation === 'refund' ? 'Refund' : 'Reverse'} Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="total">
                  {operation === 'refund' ? 'Refund Amount (cents)' : 'Reverse Amount (cents)'}
                </Label>
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
                <p className="text-xs text-muted-foreground">
                  Original: ${((transaction.total || transaction.amount) / 100).toFixed(2)}
                  {operation === 'refund' && transaction.status === 4 && transaction.refunded ? 
                    ` (Already refunded: $${(transaction.refunded / 100).toFixed(2)})` : ''}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Reason for refund/reverse"
                />
              </div>

              <div className="space-y-2">
                <Label>Reference Transaction</Label>
                <Input
                  value={transactionId}
                  disabled
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This will be set as <code>fortxn</code> in the request
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">JSON</p>
                  <CopyButton text={JSON.stringify(requestPreview, null, 2)} />
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(requestPreview, null, 2)}
                </pre>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">cURL</p>
                  <CopyButton text={curlCommand} />
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap break-all">
                  {curlCommand}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || (operation === 'refund' ? !canRefund : !canReverse)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {operation === 'refund' ? 'Create Refund' : 'Create Reverse'}
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
