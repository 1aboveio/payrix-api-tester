'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Store } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getMerchantAction } from '@/actions/platform';
import type { Merchant } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';

function formatDateSafe(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
}

const STATUS_COLOR: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  pending: 'outline',
};

export default function MerchantDetailPage() {
  const params = useParams();
  const merchantId = params.id as string;
  const { config } = usePayrixConfig();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMerchant = async () => {
      if (!config.platformApiKey || !merchantId) {
        setMerchant(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setMerchant(null);
      try {
        const requestId = generateRequestId();
        const result = await getMerchantAction({ config, requestId }, merchantId);

        if (result.apiResponse.error) {
          setMerchant(null);
          toast.error(result.apiResponse.error);
          return;
        }

        const data = result.apiResponse.data as Merchant[] | Merchant | undefined;
        const item = Array.isArray(data) ? data[0] : data;
        if (item) {
          setMerchant(item);
        } else {
          setMerchant(null);
          toast.error('Merchant not found');
        }
      } catch (error) {
        setMerchant(null);
        toast.error('Failed to fetch merchant');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchant();
  }, [config, merchantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading merchant...</div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/merchants">
            <ArrowLeft className="mr-2 size-4" />
            Back to Merchants
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Merchant not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/platform/merchants">
          <ArrowLeft className="mr-2 size-4" />
          Back to Merchants
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Store className="size-6" />
            {merchant.name || merchant.id}
          </CardTitle>
          <CardDescription>Merchant detail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={STATUS_COLOR[merchant.status] ?? 'outline'}>{merchant.status || '-'}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{merchant.type || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{formatDateSafe((merchant as any).created)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modified</p>
              <p className="font-medium">{formatDateSafe((merchant as any).modified)}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium break-all">{merchant.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{merchant.phone || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">
                {[
                  merchant.address,
                  merchant.city,
                  merchant.state,
                  merchant.zip,
                ]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">Merchant ID</p>
              <p className="font-mono break-all">{merchant.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
