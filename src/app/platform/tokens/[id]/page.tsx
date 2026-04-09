'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, CreditCard, Copy, Snowflake, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import { activePlatform } from '@/lib/config';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { getTokenAction, updateTokenAction, deleteTokenAction } from '@/actions/platform';
import type { Token } from '@/lib/platform/types';
import { TOKEN_STATUS_LABELS, TOKEN_PAYMENT_METHOD_LABELS, getTokenCustomerId } from '@/lib/platform/types';
import { toast } from '@/lib/toast';
import { generateRequestId } from '@/lib/payrix/identifiers';
import { PlatformApiResultPanel } from '@/components/platform/api-result-panel';
import type { ServerActionResult } from '@/lib/payrix/types';

function formatDateSafe(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'MMM d, yyyy');
}

function formatExpiration(expiration: string): string {
  if (!expiration || expiration.length !== 4) return '-';
  const month = expiration.slice(0, 2);
  const year = expiration.slice(2, 4);
  return `${month}/${year}`;
}

function getTokenStatus(inactive: number, frozen: number): string {
  if (inactive === 1) return 'Inactive';
  if (frozen === 1) return 'Frozen';
  return 'Active';
}

function getTokenStatusVariant(inactive: number, frozen: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (inactive === 1) return 'destructive';
  if (frozen === 1) return 'secondary';
  return 'default';
}

export default function TokenDetailPage() {
  const params = useParams();
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
      const newFrozen = token.frozen === 1 ? 0 : 1;
      const result = await updateTokenAction(
        { config, requestId },
        tokenId,
        { frozen: newFrozen }
      );
      
      if (result.apiResponse.error) {
        toast.error(`Failed to ${newFrozen === 1 ? 'freeze' : 'unfreeze'} token: ${result.apiResponse.error}`);
        return;
      }
      
      toast.success(`Token ${newFrozen === 1 ? 'frozen' : 'unfrozen'} successfully`);
      await fetchToken();
    } catch (error) {
      toast.error('Action failed');
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
        toast.error(`Failed to deactivate token: ${result.apiResponse.error}`);
        return;
      }
      
      toast.success('Token deactivated successfully');
      await fetchToken();
    } catch (error) {
      toast.error('Deactivation failed');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (token?.token) {
      navigator.clipboard.writeText(token.token);
      toast.success('Token copied to clipboard');
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

  const isFrozen = token.frozen === 1;
  const isInactive = token.inactive === 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/platform/tokens">
            <ArrowLeft className="mr-2 size-4" />
            Back to Tokens
          </Link>
        </Button>
        
        <div className="flex gap-2">
          {!isInactive && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={actionLoading}>
                    <Snowflake className="mr-2 size-4" />
                    {isFrozen ? 'Unfreeze' : 'Freeze'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isFrozen ? 'Unfreeze Token?' : 'Freeze Token?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isFrozen 
                        ? 'This will unfreeze the token, allowing it to be used for payments again.'
                        : 'This will freeze the token, preventing it from being used for payments.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleFreezeToggle}>
                      {isFrozen ? 'Unfreeze' : 'Freeze'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={actionLoading}>
                    <Trash2 className="mr-2 size-4" />
                    Deactivate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate Token?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently deactivate the token. It cannot be reactivated.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivate} className="bg-destructive">
                      Deactivate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CreditCard className="size-6" />
                Token •••• {String(token.payment?.number || '****')}
              </CardTitle>
              <CardDescription>Token detail</CardDescription>
            </div>
            <Badge variant={getTokenStatusVariant(token.inactive ?? 0, token.frozen ?? 0)}>
              {getTokenStatus(token.inactive ?? 0, token.frozen ?? 0)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1 — Payment Info */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Payment Info</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Last 4</p>
                <p className="font-mono">{String(token.payment?.number || '-')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">BIN</p>
                <p className="font-mono">{String(token.payment?.bin || '-')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Method</p>
                <p className="font-medium">
                  {TOKEN_PAYMENT_METHOD_LABELS[token.payment?.method as keyof typeof TOKEN_PAYMENT_METHOD_LABELS] || 'Card'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiration</p>
                <p className="font-mono">{formatExpiration(token.expiration || '')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2 — Status */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Status</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={getTokenStatusVariant(token.inactive ?? 0, token.frozen ?? 0)}>
                  {getTokenStatus(token.inactive ?? 0, token.frozen ?? 0)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Origin</p>
                <p className="font-mono">{token.origin}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entry Mode</p>
                <p className="font-mono">{token.entryMode}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 3 — Identifiers */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Identifiers</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Token ID</p>
                <p className="font-mono text-xs break-all">{token.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token Hash</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs break-all flex-1">{token.token}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-6" 
                    onClick={handleCopyToken}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <Link
                  href={`/platform/customers/${getTokenCustomerId(token)}`}
                  className="font-mono text-xs break-all hover:underline"
                >
                  {getTokenCustomerId(token)}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Omnitoken</p>
                <p className="font-mono text-xs break-all">{token.omnitoken || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 4 — Metadata */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Metadata</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{token.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{token.description || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Custom</p>
                <p className="font-medium">{token.custom || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDateSafe(token.created)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modified</p>
                <p className="font-medium">{formatDateSafe(token.modified)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Updater Eligible</p>
                <p className="font-mono">{token.accountUpdaterEligible === 1 ? 'Yes' : 'No'}</p>
              </div>
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
