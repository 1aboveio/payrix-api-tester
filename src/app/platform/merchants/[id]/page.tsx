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
import { getEntityAction, getMerchantAction } from '@/actions/platform';
import type { Merchant, PlatformEntity } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

function formatDateSafe(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
}

function formatAddress(entity: PlatformEntity | null, merchant: Merchant): string {
  const entityParts = [entity?.address1, entity?.address2, entity?.city, entity?.state, entity?.zip, entity?.country]
    .filter(Boolean) as string[];
  if (entityParts.length > 0) return entityParts.join(', ');

  const merchantParts = [merchant.address, merchant.city, merchant.state, merchant.zip].filter(Boolean) as string[];
  return merchantParts.length > 0 ? merchantParts.join(', ') : '-';
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
  const [entity, setEntity] = useState<PlatformEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestPreview, setRequestPreview] = useState<unknown>({});
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);
  const [panelEndpoint, setPanelEndpoint] = useState('');

  useEffect(() => {
    const fetchMerchant = async () => {
      if (!config.platformApiKey || !merchantId) {
        setMerchant(null);
        setEntity(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setMerchant(null);
      setEntity(null);
      try {
        const requestId = generateRequestId();
        setPanelEndpoint(`/merchants/${merchantId}`);
        setRequestPreview({});
        const result = await getMerchantAction({ config, requestId }, merchantId);
        setResult(result as ServerActionResult<unknown>);

        if (result.apiResponse.error) {
          setMerchant(null);
          setEntity(null);
          toast.error(result.apiResponse.error);
          return;
        }

        const data = result.apiResponse.data as Merchant[] | Merchant | undefined;
        const item = Array.isArray(data) ? data[0] : data;
        if (item) {
          setMerchant(item);

          // Handle entity - could be string ID or embedded object
          const entityValue = (item as any).entity;
          if (entityValue && typeof entityValue === 'object') {
            // Entity already embedded
            setEntity(entityValue as PlatformEntity);
          } else if (entityValue && typeof entityValue === 'string') {
            // Fetch entity by ID
            const entityRequestId = generateRequestId();
            setPanelEndpoint(`/entities/${entityValue}`);
            setRequestPreview({});
            const entityResult = await getEntityAction({ config, requestId: entityRequestId }, entityValue);
            setResult(entityResult as ServerActionResult<unknown>);
            if (!entityResult.apiResponse.error) {
              const entityData = entityResult.apiResponse.data as PlatformEntity[] | PlatformEntity | undefined;
              const entityItem = Array.isArray(entityData) ? entityData[0] : entityData;
              setEntity(entityItem || null);
            }
          }
        } else {
          setMerchant(null);
          setEntity(null);
          toast.error('Merchant not found');
        }
      } catch (error) {
        setMerchant(null);
        setEntity(null);
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
              <p className="font-medium break-all">{entity?.email || merchant.email || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{entity?.phone || merchant.phone || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{formatAddress(entity, merchant)}</p>
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

      <PlatformApiResultPanel
        config={config}
        endpoint={panelEndpoint || `/merchants/${merchantId}`}
        method="GET"
        requestPreview={requestPreview}
        result={result}
        loading={loading}
      />
    </div>
  );
}
