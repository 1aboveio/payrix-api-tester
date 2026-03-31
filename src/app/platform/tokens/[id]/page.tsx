'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CreditCard, Snowflake, PowerOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getTokenAction, updateTokenAction } from '@/actions/platform';
import type { Token } from '@/lib/platform/types';
import { TOKEN_STATUS_LABELS, TOKEN_PAYMENT_METHOD_LABELS } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function formatDateSafe(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : '-';
}

export default function TokenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tokenId = params.id as string;
  const { config } = usePayrixConfig();

  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [result, setResult] = useState<ServerActionResult<unknown> | null>(null);

  const fetchToken = async () => {
    if (!activePlatform(config).platformApiKey || !tokenId) {
      setToken(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setToken(null);
    try {
      const requestId = generateRequestId();
      const result = await getTokenAction({ config, requestId }, tokenId);
      setResult(result as ServerActionResult<unknown>);

      if (result.apiResponse.error) {
        setToken(null);
        toast.error(result.apiResponse.error);
        return;
      }

      const data = result.apiResponse.data as Token[] | Token | undefined;
      const item = Array.isArray(data) ? data[0] : data;
      if (item) {
        setToken(item);
      } else {
        setToken(null);
        toast.error('Token not found');
      }
    } catch (error) {
      setToken(null);
      toast.error('Failed to fetch token');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, [config, tokenId]);

  const handleFreezeToggle = async () => {
    if (!token) return;
    
    setActionLoading(true);
    try {
      const requestId = generateRequestId();
      const newFrozenState = token.frozen === 1 ? 0 : 1;
      const result = await updateTokenAction(
        { config, requestId },
        tokenId,
        { frozen: newFrozenState }
      );

      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      toast.success(newFrozenState === 1 ? 'Token frozen' : 'Token unfrozen');
      await fetchToken();
    } catch (error) {
      toast.error('Failed to update token');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!token) return;
    
    setActionLoading(true);
    try {
      const requestId = generateRequestId();
      const result = await updateTokenAction(
        { config, requestId },
        tokenId,
        { inactive: 1 }
      );

      if (result.apiResponse.error) {
        toast.error(result.apiResponse.error);
        return;
      }

      toast.success('Token deactivated');
      await fetchToken();
    } catch (error) {
      toast.error('Failed to deactivate token');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading token...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/tokens">
            <ArrowLeft className="mr-2 size-4" />
            Back to Tokens
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Token not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (token.frozen === 1) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Frozen</Badge>;
    }
    if (token.inactive === 1) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/platform/tokens">
          <ArrowLeft className="mr-2 size-4" />
          Back to Tokens
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CreditCard className="size-6" />
                •••• {token.payment?.number || '****'}
              </CardTitle>
              <CardDescription>Token detail</CardDescription>
            </div>
            <div className="flex gap-2">
              {token.inactive !== 1 && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={actionLoading}
                      >
                        <Snowflake className="mr-2 size-4" />
                        {token.frozen === 1 ? 'Unfreeze' : 'Freeze'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {token.frozen === 1 ? 'Unfreeze Token' : 'Freeze Token'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {token.frozen === 1 
                            ? 'This will allow the token to be used for transactions again.'
                            : 'This will prevent the token from being used for transactions.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFreezeToggle}>
                          {token.frozen === 1 ? 'Unfreeze' : 'Freeze'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={actionLoading}
                      >
                        <PowerOff className="mr-2 size-4" />
                        Deactivate
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Token</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently deactivate the token. It cannot be reactivated.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground">
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Info */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Last 4</p>
              <p className="font-medium">•••• {token.payment?.number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">BIN</p>
              <p className="font-medium">{token.payment?.bin || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Method</p>
              <p className="font-medium">{TOKEN_PAYMENT_METHOD_LABELS[token.payment?.method as number] || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiration</p>
              <p className="font-medium">
                {token.expiration ? `${token.expiration.slice(0, 2)}/${token.expiration.slice(2)}` : '-'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Origin</p>
              <p className="font-medium">{token.origin}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Entry Mode</p>
              <p className="font-medium">{token.entryMode}</p>
            </div>
          </div>

          <Separator />

          {/* Identifiers */}
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Token ID</p>
              <p className="font-mono break-all">{token.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Token Hash</p>
              <p className="font-mono break-all">{token.token}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p 
                className="font-mono break-all cursor-pointer text-blue-600 hover:underline"
                onClick={() => router.push(`/platform/customers/${token.customer}`)}
              >
                {token.customer}
              </p>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{normalizeText(token.name)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Description</p>
              <p className="font-medium">{normalizeText(token.description)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Custom</p>
              <p className="font-medium">{normalizeText(token.custom)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatDateSafe(token.created)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Modified</p>
              <p className="font-medium">{formatDateSafe(token.modified)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PlatformApiResultPanel
        config={config}
        endpoint={`/tokens/${tokenId}`}
        method="GET"
        requestPreview={{}}
        result={result}
        loading={loading}
      />
    </div>
  );
}