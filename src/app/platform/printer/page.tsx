'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  bindPrinterAction,
  printSunmiTestReceiptAction,
  queryPrinterStatusAction,
  type SunmiPrinterStatusResult,
  unbindPrinterAction,
} from '@/actions/payrix';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePayrixConfig } from '@/hooks/use-payrix-config';
import { toast } from '@/lib/toast';

export default function PlatformPrinterPage() {
  const { config } = usePayrixConfig();
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [binding, setBinding] = useState(false);
  const [unbinding, setUnbinding] = useState(false);
  const [status, setStatus] = useState<SunmiPrinterStatusResult | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [msn, setMsn] = useState('');
  const [shopId, setShopId] = useState('');
  const [label, setLabel] = useState('');
  const [showUnbindConfirm, setShowUnbindConfirm] = useState(false);

  // Pre-fill from config
  useEffect(() => {
    if (config.expressAccountId && !shopId) {
      setShopId(config.expressAccountId);
    }
    if (status?.configuredPrinterSerial && !msn) {
      setMsn(status.configuredPrinterSerial);
    }
  }, [config.expressAccountId, msn, shopId, status?.configuredPrinterSerial]);

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

  const runBind = async () => {
    if (!msn || !shopId) {
      toast.error('MSN and Shop ID are required.');
      return;
    }
    setBinding(true);
    try {
      const result = await bindPrinterAction({ msn, shopId, label: label || undefined });
      if (result.success) {
        toast.success('Printer bound successfully.');
        setLabel('');
        await refreshStatus();
      } else {
        toast.error(`Bind failed: ${result.error}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to bind printer.';
      toast.error(message);
    } finally {
      setBinding(false);
    }
  };

  const runUnbind = async () => {
    if (!msn || !shopId) {
      toast.error('MSN and Shop ID are required.');
      return;
    }
    setUnbinding(true);
    try {
      const result = await unbindPrinterAction({ msn, shopId });
      if (result.success) {
        toast.success('Printer unbound successfully.');
        setShowUnbindConfirm(false);
        await refreshStatus();
      } else {
        toast.error(`Unbind failed: ${result.error}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unbind printer.';
      toast.error(message);
    } finally {
      setUnbinding(false);
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

      <Card>
        <CardHeader>
          <CardTitle>Printer Management</CardTitle>
          <CardDescription>Bind or unbind printers from your shop in Sunmi Cloud.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="grid gap-1">
              <label htmlFor="msn" className="text-sm font-medium">
                Printer Serial Number (MSN)
              </label>
              <Input
                id="msn"
                placeholder="Enter printer MSN"
                value={msn}
                onChange={(e) => setMsn(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="shopId" className="text-sm font-medium">
                Shop ID
              </label>
              <Input
                id="shopId"
                placeholder="Enter shop ID"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <label htmlFor="label" className="text-sm font-medium">
                Label (optional)
              </label>
              <Input
                id="label"
                placeholder="e.g., Kitchen Printer"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={runBind} disabled={binding || !msn || !shopId}>
              {binding ? 'Binding...' : 'Bind Printer'}
            </Button>

            {status?.found && (
              <>
                {showUnbindConfirm ? (
                  <>
                    <Button variant="destructive" onClick={runUnbind} disabled={unbinding}>
                      {unbinding ? 'Unbinding...' : 'Confirm Unbind'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowUnbindConfirm(false)} disabled={unbinding}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="destructive" onClick={() => setShowUnbindConfirm(true)}>
                    Unbind Printer
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
