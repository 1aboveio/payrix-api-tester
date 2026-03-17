'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  printSunmiTestReceiptAction,
  queryPrinterStatusAction,
  type SunmiPrinterStatusResult,
} from '@/actions/payrix';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { toast } from '@/lib/toast';

export default function PlatformPrinterPage() {
  const { config } = usePayrixConfig();
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [status, setStatus] = useState<SunmiPrinterStatusResult | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setStatusError(null);

    try {
      const nextStatus = await queryPrinterStatusAction({
        config,
      });
      setStatus(nextStatus);
      if (nextStatus.error) {
        toast.info(nextStatus.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to query printer status.';
      setStatusError(message);
      setStatus(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [config.expressAccountId]);

  const runTestPrint = async () => {
    setPrinting(true);
    try {
      const result = await printSunmiTestReceiptAction({
        shopId: config.expressAccountId,
        merchantName: config.expressAccountId,
      });

      if (result.printed) {
        toast.success('Test print sent to shared Sunmi printer.');
      } else {
        toast.error(`Test print failed: ${result.error || result.reason}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send test print.';
      toast.error(message);
    } finally {
      setPrinting(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const statusBadgeVariant = status?.online ? 'default' : 'secondary';
  const statusBadgeLabel =
    status?.error && !status.found ? 'Error' : status?.error && !status.online ? 'Offline' : status?.status || 'Unknown';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Printer Connectivity</CardTitle>
          <CardDescription>Check shared Sunmi printer status and send a sample test print.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Cloud Printer SN</span>
              <span className="text-muted-foreground">{status?.configuredPrinterSerial ?? 'Not configured'}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Printer Status</span>
              <Badge variant={statusBadgeVariant} className="capitalize">
                {statusBadgeLabel}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Model</span>
              <span className="text-muted-foreground">{status?.model || 'Unknown'}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Last seen</span>
              <span className="text-muted-foreground">{status?.lastSeen || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Online</span>
              <span>{status?.online ? 'Yes' : 'No'}</span>
            </div>

            {status?.printerCount !== undefined && (
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Bound printers</span>
                <span className="text-muted-foreground">{status.printerCount}</span>
              </div>
            )}

            {status?.checkedAt && (
              <div className="text-xs text-muted-foreground">Checked at: {new Date(status.checkedAt).toLocaleString()}</div>
            )}

            {statusError && <div className="text-sm text-red-500">{statusError}</div>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={refreshStatus} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh status'}
            </Button>
            <Button onClick={runTestPrint} disabled={printing || loading}>
              {printing ? 'Printing...' : 'Test Print'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test target</CardTitle>
          <CardDescription>
            Uses configured printer SN in Sunmi Cloud API and sends a sample approved receipt payload.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Shop/Account ID: {config.expressAccountId || 'Not configured'}</CardContent>
      </Card>
    </div>
  );
}
