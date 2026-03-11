'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, CreditCard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getTransactionAction } from '@/actions/platform';
import type { Transaction, TransactionStatus } from '@/lib/platform/types';
import { TRANSACTION_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  0: 'secondary',  // Pending
  1: 'default',    // Approved
  2: 'destructive', // Failed
  3: 'default',    // Captured
  4: 'default',    // Settled
  5: 'outline',    // Returned
};

function formatDateSafe(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy HH:mm');
}

function formatCurrency(amount: number, currency?: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount / 100);
}

export default function TransactionDetailPage() {
  const params = useParams();
  const transactionId = params.id as string;
  const { config } = usePayrixConfig();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);

  useEffect(() => {
    async function fetchTransaction() {
      if (!transactionId) return;
      
      setLoading(true);
      try {
        const requestId = generateRequestId();
        const response = await getTransactionAction({ config, requestId }, transactionId);
        
        if (response.apiResponse.error) {
          const errorMsg = typeof response.apiResponse.error === 'string' 
            ? response.apiResponse.error 
            : (response.apiResponse.error as any)?.message || 'API error';
          toast.error(`Failed to fetch transaction: ${errorMsg}`);
          setTransaction(null);
        } else if (response.apiResponse.data) {
          const data = response.apiResponse.data as Transaction[] | Transaction | undefined;
          const item = Array.isArray(data) ? data[0] : data;
          setTransaction(item || null);
        }
        
        setResult(response);
      } catch (error) {
        console.error('Error fetching transaction:', error);
        toast.error('Failed to fetch transaction');
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [transactionId, config]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/platform/transactions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">Loading transaction...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/platform/transactions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-muted-foreground">Transaction not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/platform/transactions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Transaction Details</h1>
            <p className="text-muted-foreground font-mono text-sm">{transaction.id}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/platform/transactions/${transaction.id}/edit`}>
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatCurrency(transaction.total || 0, transaction.currency)}</span>
            </div>
            {transaction.tip && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tip</span>
                <span className="font-medium">{formatCurrency(transaction.tip || 0, transaction.currency)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{formatCurrency(transaction.total || 0, transaction.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={TRANSACTION_STATUS_COLORS[transaction.status] || 'default'}>
                {TRANSACTION_STATUS_LABELS[transaction.status] ?? transaction.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{transaction.type ? TRANSACTION_TYPE_LABELS[transaction.type] : '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card Info */}
        <Card>
          <CardHeader>
            <CardTitle>Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Card Type</span>
              <span>{transaction.cardType || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last 4</span>
              <span className="font-mono">{transaction.last4 || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token Last 4</span>
              <span className="font-mono">{transaction.tokenLast4 || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">AVS Response</span>
              <span>{transaction.avsResponse || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CVV Response</span>
              <span>{transaction.cvvResponse || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Merchant/Customer */}
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Login ID</span>
              <span className="font-mono text-sm">{transaction.login}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Merchant</span>
              <span className="font-mono text-sm">{transaction.merchant}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-mono text-sm">{transaction.customer || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token</span>
              <span className="font-mono text-sm">{transaction.token || '-'}</span>
            </div>
            {transaction.subscription && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subscription</span>
                <span className="font-mono text-sm">{transaction.subscription}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlement & Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Settlement & Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settled</span>
              <span>{transaction.settled ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Settle Date</span>
              <span>{formatDateSafe(transaction.settleDate)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDateSafe(transaction.created)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modified</span>
              <span>{formatDateSafe(transaction.modified)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Reason */}
        {(transaction.reasonCode || transaction.reason) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Code</span>
                <span>{transaction.reasonCode || '-'}</span>
              </div>
              <div className="mt-2">
                <span className="text-muted-foreground">Message</span>
                <p className="mt-1">{transaction.reason || '-'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {transaction.description && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{transaction.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {result && (
        <PlatformApiResultPanel
          config={config}
          endpoint={`/txns/${transactionId}`}
          method="GET"
          requestPreview={{}}
          result={result}
          loading={loading}
        />
      )}
    </div>
  );
}
