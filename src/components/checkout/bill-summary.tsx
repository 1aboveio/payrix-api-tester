'use client';

import { format } from 'date-fns';
import { Receipt, Calendar, CreditCard, Repeat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Invoice, Subscription, Plan } from '@/lib/platform/types';
import { getPlanCycleLabel } from '@/lib/platform/types';

interface BillSummaryProps {
  invoice?: Invoice;
  subscription?: Subscription;
  plan?: Plan;
}

function formatCurrency(amount: number, currency?: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format((amount || 0) / 100); // Payrix amounts are in cents
}

function formatPayrixDate(num?: number): string {
  if (!num) return '-';
  const s = String(num);
  if (s.length !== 8) return '-';
  const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
  return isNaN(d.getTime()) ? '-' : format(d, 'MMM d, yyyy');
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function BillSummary({ invoice, subscription, plan }: BillSummaryProps) {
  if (invoice) {
    const total = invoice.total || 0;
    const tax = invoice.tax || 0;
    const subtotal = total - tax;
    
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="size-5" />
            Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Invoice ID</span>
            <span className="font-mono text-sm">{invoice.id}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Invoice Number</span>
            <span className="font-mono">{invoice.number}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
              {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
            </Badge>
          </div>
          
          {invoice.dueDate && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {formatDate(invoice.dueDate)}
              </span>
            </div>
          )}
          
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          {tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}
          
          {invoice.discount && invoice.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Due</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscription && plan) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Repeat className="size-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Billing Cycle</span>
            <span className="capitalize">{getPlanCycleLabel(plan)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Start Date</span>
            <span className="flex items-center gap-1">
              <Calendar className="size-4" />
              {formatPayrixDate(subscription.start)}
            </span>
          </div>

          {subscription.finish && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Date</span>
              <span>{formatPayrixDate(subscription.finish)}</span>
            </div>
          )}
          
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium">First Period Payment</h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Charged today</span>
              <span className="font-semibold">{formatCurrency(plan.amount, plan.currency)}</span>
            </div>
          </div>

          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium">Future Payments</h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Every {getPlanCycleLabel(plan).toLowerCase()} period</span>
              <span>{formatCurrency(plan.amount, plan.currency)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your card will be saved and charged automatically each {getPlanCycleLabel(plan).toLowerCase()} period.
            </p>
          </div>
          
          {plan.description && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">No bill information available</div>
      </CardContent>
    </Card>
  );
}

export default BillSummary;