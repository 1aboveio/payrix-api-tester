'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { listCustomersAction } from '@/actions/platform';
import type { Customer } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';

function formatDateSafe(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : '-';
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const { config } = usePayrixConfig();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!config.platformApiKey || !customerId) {
        setCustomer(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setCustomer(null);
      try {
        const requestId = generateRequestId();
        const result = await listCustomersAction(
          { config, requestId },
          [{ field: 'id', operator: 'eq', value: customerId }],
          { page: 1, limit: 1 }
        );

        if (result.apiResponse.error) {
          setCustomer(null);
          toast.error(result.apiResponse.error);
          return;
        }

        const data = result.apiResponse.data as Customer[] | undefined;
        if (data && data.length > 0) {
          setCustomer(data[0]);
        } else {
          setCustomer(null);
          toast.error('Customer not found');
        }
      } catch (error) {
        setCustomer(null);
        toast.error('Failed to fetch customer');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [config, customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading customer...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/customers">
            <ArrowLeft className="mr-2 size-4" />
            Back to Customers
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/platform/customers">
          <ArrowLeft className="mr-2 size-4" />
          Back to Customers
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <User className="size-6" />
            {fullName || customer.id}
          </CardTitle>
          <CardDescription>Customer detail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium break-all">{normalizeText(customer.email)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{normalizeText(customer.phone)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDateSafe((customer as any).created)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Customer ID</p>
              <p className="font-mono break-all">{customer.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Merchant</p>
              <p className="font-mono break-all">{normalizeText(customer.merchant)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Login</p>
              <p className="font-mono break-all">{normalizeText(customer.login)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
